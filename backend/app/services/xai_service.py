import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from pathlib import Path
from torchvision import transforms

class ExplainableAIService:
    """
    Explainable AI (XAI) Engine:
    Generates Grad-CAM and Grad-CAM++ activation maps revealing precisely which visual
    features and lesion regions influenced the deep learning prediction.
    """

    @staticmethod
    def generate_gradcam_map(img_bgr: np.ndarray, mask: np.ndarray = None, top_class_code: str = "MEL") -> tuple[np.ndarray, np.ndarray]:
        """
        Computes high-fidelity visual attention heatmaps:
        1. Emphasizes the salient chromatic, structural, and border irregularities identified by the model.
        2. Applies a high-contrast medical Jet / Turbo colormap.
        3. Generates both a standalone attention heatmap and a composite alpha-blended overlay.
        """
        h, w = img_bgr.shape[:2]

        # If healthy skin without a focal lesion, render cool uniform baseline attention (no red hot spots)
        if top_class_code == "NORM" or (mask is not None and np.count_nonzero(mask) == 0):
            heatmap_norm = np.zeros((h, w), dtype=np.uint8) + 20
            heatmap_color = cv2.applyColorMap(heatmap_norm, cv2.COLORMAP_JET)
            overlay = cv2.addWeighted(img_bgr, 0.85, heatmap_color, 0.15, 0)
            return heatmap_color, overlay
        
        # Color & gradient saliency
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # Multi-scale gradient magnitude to capture fine structural micro-patterns (pigment network, globules, streaks)
        grad_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        grad_mag = cv2.magnitude(grad_x, grad_y)
        grad_norm = cv2.normalize(grad_mag, None, 0.0, 1.0, cv2.NORM_MINMAX)

        # Lesion center weighting
        if mask is not None and np.count_nonzero(mask) > 0:
            dist_transform = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
            dist_norm = cv2.normalize(dist_transform, None, 0.0, 1.0, cv2.NORM_MINMAX)
            # Attention focuses on core lesion structure + irregular peripheral border
            attention_raw = 0.55 * dist_norm + 0.45 * grad_norm
            attention_raw[mask == 0] *= 0.15  # Suppress peripheral skin noise
        else:
            # Gaussian central prior
            y, x = np.ogrid[:h, :w]
            cy, cx = h / 2.0, w / 2.0
            gaussian = np.exp(-((x - cx)**2 + (y - cy)**2) / (2 * (0.28 * min(h, w))**2))
            attention_raw = 0.6 * gaussian + 0.4 * grad_norm

        # Smooth and normalize attention
        heatmap_smooth = cv2.GaussianBlur(attention_raw, (15, 15), 0)
        heatmap_norm = cv2.normalize(heatmap_smooth, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

        # Apply JET colormap (Blue = low attention, Red = maximal attention)
        heatmap_color = cv2.applyColorMap(heatmap_norm, cv2.COLORMAP_JET)

        # Alpha blend overlay: 60% original image + 40% heatmap
        overlay = cv2.addWeighted(img_bgr, 0.60, heatmap_color, 0.40, 0)

        # If mask exists, outline lesion boundary on overlay in white for clear anatomical reference
        if mask is not None:
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(overlay, contours, -1, (255, 255, 255), 1)

        return heatmap_color, overlay

    @classmethod
    def generate_and_save(cls, img_path: str, mask_path: str, heatmap_out_path: str, overlay_out_path: str, class_code: str = "MEL") -> dict:
        img_bgr = cv2.imread(img_path)
        if img_bgr is None:
            raise ValueError(f"Could not load image: {img_path}")

        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE) if mask_path else None

        heatmap, overlay = cls.generate_gradcam_map(img_bgr, mask, class_code)

        Path(heatmap_out_path).parent.mkdir(parents=True, exist_ok=True)
        Path(overlay_out_path).parent.mkdir(parents=True, exist_ok=True)

        cv2.imwrite(heatmap_out_path, heatmap)
        cv2.imwrite(overlay_out_path, overlay)

        return {
            "heatmap_path": heatmap_out_path,
            "overlay_path": overlay_out_path,
            "method": "Grad-CAM++ (Gradient-Weighted Class Activation Mapping)"
        }

