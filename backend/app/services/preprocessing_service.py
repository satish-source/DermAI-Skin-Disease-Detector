import cv2
import numpy as np
from pathlib import Path
from PIL import Image
from app.config import settings

class SkinPreprocessingEngine:
    @staticmethod
    def apply_dull_razor(img_bgr: np.ndarray) -> np.ndarray:
        """
        DullRazor algorithm for hair artifact removal in dermatological images:
        1. Grayscale conversion
        2. Morphological Black Top-Hat filtering to isolate dark hair strands
        3. Thresholding to create a binary hair mask
        4. Inpainting using Telea / Navier-Stokes method to replace hair pixels
        """
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # Rectangular structuring element to capture linear hairs in different directions
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
        blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
        
        # Threshold the blackhat to obtain hair mask
        _, hair_mask = cv2.threshold(blackhat, 10, 255, cv2.THRESH_BINARY)
        
        # Inpaint using Telea fast marching method
        inpainted = cv2.inpaint(img_bgr, hair_mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
        return inpainted

    @staticmethod
    def apply_color_constancy(img_bgr: np.ndarray) -> np.ndarray:
        """
        Grey World algorithm for color constancy across varied smartphone sensors:
        Normalizes color casts so illumination does not bias the deep learning classifier.
        """
        img_float = img_bgr.astype(np.float32)
        mean_b = np.mean(img_float[:, :, 0])
        mean_g = np.mean(img_float[:, :, 1])
        mean_r = np.mean(img_float[:, :, 2])
        
        avg_gray = (mean_b + mean_g + mean_r) / 3.0
        
        # Scale each channel
        kb = avg_gray / (mean_b + 1e-6)
        kg = avg_gray / (mean_g + 1e-6)
        kr = avg_gray / (mean_r + 1e-6)
        
        img_float[:, :, 0] *= kb
        img_float[:, :, 1] *= kg
        img_float[:, :, 2] *= kr
        
        return np.clip(img_float, 0, 255).astype(np.uint8)

    @staticmethod
    def apply_clahe(img_bgr: np.ndarray) -> np.ndarray:
        """
        Applies Contrast Limited Adaptive Histogram Equalization on the Luminance (L) channel
        of LAB color space to preserve color fidelity while optimizing lesion edge contrast.
        """
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        
        merged_lab = cv2.merge((cl, a, b))
        return cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)

    @classmethod
    def preprocess_image(cls, input_image_path: str, output_image_path: str, target_size: tuple[int, int] = (224, 224)) -> dict:
        """
        Full Preprocessing Pipeline:
        Raw Image -> Color Constancy -> DullRazor Hair Removal -> CLAHE Contrast -> Resizing
        """
        img = cv2.imread(input_image_path)
        if img is None:
            raise ValueError(f"Could not read image from {input_image_path}")

        # Step 1: Color Constancy
        color_balanced = cls.apply_color_constancy(img)
        
        # Step 2: Hair Removal (DullRazor)
        hair_removed = cls.apply_dull_razor(color_balanced)
        
        # Step 3: Bilateral Filter for gentle noise smoothing while preserving lesion borders
        denoised = cv2.bilateralFilter(hair_removed, d=5, sigmaColor=50, sigmaSpace=50)
        
        # Step 4: CLAHE Contrast Enhancement
        enhanced = cls.apply_clahe(denoised)
        
        # Step 5: Resize to standardized model input
        resized = cv2.resize(enhanced, target_size, interpolation=cv2.INTER_AREA)
        
        # Save output
        Path(output_image_path).parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(output_image_path, resized)
        
        return {
            "processed_path": output_image_path,
            "target_size": target_size,
            "applied_steps": [
                "Grey World Color Constancy",
                "DullRazor Morphological Hair Artifact Removal",
                "Bilateral Noise Reduction",
                "CLAHE LAB-Channel Contrast Enhancement",
                f"Standardized Resizing to {target_size[0]}x{target_size[1]}"
            ]
        }

