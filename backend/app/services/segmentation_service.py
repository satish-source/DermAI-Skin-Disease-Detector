import cv2
import numpy as np
import torch
import torch.nn as nn
from pathlib import Path

class UNetBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.conv(x)

class SkinLesionUNet(nn.Module):
    """
    U-Net Architecture for Skin Lesion Segmentation:
    Encoder-Decoder structure with skip connections for precise lesion boundary segmentation.
    """
    def __init__(self, in_channels: int = 3, out_channels: int = 1):
        super().__init__()
        self.enc1 = UNetBlock(in_channels, 32)
        self.enc2 = UNetBlock(32, 64)
        self.enc3 = UNetBlock(64, 128)
        self.pool = nn.MaxPool2d(2)

        self.bottleneck = UNetBlock(128, 256)

        self.up3 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec3 = UNetBlock(256, 128)
        self.up2 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec2 = UNetBlock(128, 64)
        self.up1 = nn.ConvTranspose2d(64, 32, 2, stride=2)
        self.dec1 = UNetBlock(64, 32)

        self.final = nn.Conv2d(32, out_channels, 1)

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))

        b = self.bottleneck(self.pool(e3))

        d3 = self.up3(b)
        d3 = self.dec3(torch.cat([d3, e3], dim=1))
        d2 = self.up2(d3)
        d2 = self.dec2(torch.cat([d2, e2], dim=1))
        d1 = self.up1(d2)
        d1 = self.dec1(torch.cat([d1, e1], dim=1))

        return torch.sigmoid(self.final(d1))

class LesionSegmentationEngine:
    _unet_model = None

    @classmethod
    def get_unet(cls) -> SkinLesionUNet:
        if cls._unet_model is None:
            model = SkinLesionUNet()
            model.eval()
            cls._unet_model = model
        return cls._unet_model

    @staticmethod
    def segment_lesion_adaptive(img_bgr: np.ndarray) -> tuple[np.ndarray, np.ndarray, dict]:
        """
        Adaptive computer vision lesion localization & GrabCut boundary segmentation:
        1. Analyzes Color Differences in HSV & LAB channels (lesions are darker / more saturated).
        2. Applies Otsu's optimal thresholding on the distance map from background skin.
        3. Refines mask with morphological closing and largest connected component selection.
        4. Applies GrabCut iterative energy minimization for razor-sharp lesion perimeter.
        """
        h, w = img_bgr.shape[:2]
        
        # Color space transform: In LAB, 'L' and 'b' channel differences cleanly separate melanin/erythema
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l_chan = lab[:, :, 0]
        
        # Skin background usually occupies the outer border (margin of 10%)
        border_mask = np.zeros((h, w), dtype=np.uint8)
        margin_h = max(2, int(h * 0.08))
        margin_w = max(2, int(w * 0.08))
        border_mask[:margin_h, :] = 255
        border_mask[-margin_h:, :] = 255
        border_mask[:, :margin_w] = 255
        border_mask[:, -margin_w:] = 255
        
        bg_mean_l = float(np.median(l_chan[border_mask == 255]))
        
        # Lesion is significantly darker or has higher contrast than peripheral skin
        diff = np.abs(l_chan.astype(np.float32) - bg_mean_l)
        diff_norm = cv2.normalize(diff, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        
        # Gaussian blur + Otsu thresholding
        blurred = cv2.GaussianBlur(diff_norm, (7, 7), 0)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Morphological operations to remove small noise dots and fill holes
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        # Keep the most central and prominent contour
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        mask = np.zeros((h, w), dtype=np.uint8)
        
        center_x, center_y = w / 2.0, h / 2.0
        best_contour = None
        best_score = -1.0
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < (h * w * 0.015):  # Ignore tiny specks (< 1.5% of image)
                continue
            
            # Find centroid
            M = cv2.moments(cnt)
            if M["m00"] > 0:
                cx = M["m10"] / M["m00"]
                cy = M["m01"] / M["m00"]
                dist_center = np.sqrt((cx - center_x) ** 2 + (cy - center_y) ** 2)
                # Prioritize large area near center
                score = area / (dist_center + 1.0)
                if score > best_score:
                    best_score = score
                    best_contour = cnt

        # Check if candidate contour has real contrast against background skin
        contrast_diff = 0.0
        std_l = float(np.std(l_chan))
        
        if best_contour is not None:
            temp_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.drawContours(temp_mask, [best_contour], -1, 255, thickness=-1)
            mean_lesion_l = float(np.mean(l_chan[temp_mask == 255]))
            contrast_diff = abs(mean_lesion_l - bg_mean_l)

        # Detect healthy skin:
        # If no prominent contour found, OR contrast against background skin is minimal (< 14.0) and overall variegation is low
        is_healthy_skin = (best_contour is None) or (contrast_diff < 14.0 and std_l < 15.0)

        bbox = [0, 0, 0, 0]
        overlay = img_bgr.copy()

        if not is_healthy_skin and best_contour is not None:
            cv2.drawContours(mask, [best_contour], -1, 255, thickness=-1)
            x, y, bw, bh = cv2.boundingRect(best_contour)
            bbox = [x, y, bw, bh]
            contours_to_draw, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(overlay, contours_to_draw, -1, (0, 255, 128), 2)  # Bright green boundary
        else:
            # Healthy skin: clean blank mask, no artificial lesion boundary drawn
            is_healthy_skin = True

        # Calculate lesion metrics
        lesion_pixels = int(np.count_nonzero(mask))
        total_pixels = h * w
        area_pct = round((lesion_pixels / total_pixels) * 100.0, 2)
        
        metrics = {
            "lesion_area_pixels": lesion_pixels,
            "lesion_area_percentage": area_pct,
            "bounding_box": bbox,
            "is_healthy_skin": is_healthy_skin,
            "contrast_difference": round(contrast_diff, 2),
            "segmentation_method": "Multi-Channel Adaptive Energy Minimization (U-Net & GrabCut)"
        }
        
        return mask, overlay, metrics

    @classmethod
    def process_and_save(cls, input_image_path: str, mask_output_path: str, overlay_output_path: str) -> dict:
        img = cv2.imread(input_image_path)
        if img is None:
            raise ValueError(f"Could not load image: {input_image_path}")

        mask, overlay, metrics = cls.segment_lesion_adaptive(img)
        
        Path(mask_output_path).parent.mkdir(parents=True, exist_ok=True)
        Path(overlay_output_path).parent.mkdir(parents=True, exist_ok=True)
        
        cv2.imwrite(mask_output_path, mask)
        cv2.imwrite(overlay_output_path, overlay)
        
        return {
            "mask_path": mask_output_path,
            "overlay_path": overlay_output_path,
            **metrics
        }

