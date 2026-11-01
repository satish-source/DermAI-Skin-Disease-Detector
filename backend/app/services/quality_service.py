import cv2
import numpy as np
from app.config import settings

class ImageQualityAssessmentService:
    @staticmethod
    def assess_quality(image_path: str) -> dict:
        """
        Performs multi-factor dermatological mobile image quality assessment:
        1. Blur detection (Laplacian variance)
        2. Exposure & Luminance (Underexposed / Overexposed)
        3. RMS Contrast
        4. Resolution check
        Returns a structured dictionary with overall quality score, status, and remediation tips.
        """
        img = cv2.imread(image_path)
        if img is None:
            return {
                "blur_score": 0.0,
                "is_blurry": True,
                "mean_luminance": 0.0,
                "is_underexposed": True,
                "is_overexposed": False,
                "rms_contrast": 0.0,
                "is_low_contrast": True,
                "width": 0,
                "height": 0,
                "resolution_ok": False,
                "overall_status": "Poor Quality",
                "overall_score": 0.0,
                "rejection_reasons": ["Unable to decode image file."],
                "remediation_tips": ["Please upload a valid JPEG or PNG image."]
            }

        height, width = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Blur Detection using Variance of the Laplacian
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        is_blurry = laplacian_var < settings.BLUR_LAPLACIAN_THRESHOLD

        # 2. Exposure & Luminance
        mean_luminance = float(np.mean(gray))
        is_underexposed = mean_luminance < settings.UNDEREXPOSURE_LUMINANCE
        is_overexposed = mean_luminance > settings.OVEREXPOSURE_LUMINANCE

        # 3. RMS Contrast
        rms_contrast = float(np.std(gray))
        is_low_contrast = rms_contrast < settings.CONTRAST_THRESHOLD

        # 4. Resolution check
        resolution_ok = (width >= settings.MIN_RESOLUTION_WIDTH and height >= settings.MIN_RESOLUTION_HEIGHT)

        rejection_reasons = []
        remediation_tips = []

        if is_blurry:
            rejection_reasons.append(f"Image is too blurry (sharpness score {laplacian_var:.1f} < threshold {settings.BLUR_LAPLACIAN_THRESHOLD}).")
            remediation_tips.append("Hold your mobile phone steady and tap the skin lesion to autofocus before capturing.")

        if is_underexposed:
            rejection_reasons.append(f"Image is too dark (mean brightness {mean_luminance:.1f} < {settings.UNDEREXPOSURE_LUMINANCE}).")
            remediation_tips.append("Move to a well-lit area or enable the phone camera flash.")

        if is_overexposed:
            rejection_reasons.append(f"Image is washed out / overexposed (mean brightness {mean_luminance:.1f} > {settings.OVEREXPOSURE_LUMINANCE}).")
            remediation_tips.append("Avoid direct glare or excessive flash reflection on the skin.")

        if is_low_contrast:
            rejection_reasons.append(f"Low image contrast ({rms_contrast:.1f} < {settings.CONTRAST_THRESHOLD}).")
            remediation_tips.append("Ensure the lesion is clearly distinguishable from the surrounding skin lighting.")

        if not resolution_ok:
            rejection_reasons.append(f"Image resolution too low ({width}x{height} < {settings.MIN_RESOLUTION_WIDTH}x{settings.MIN_RESOLUTION_HEIGHT}).")
            remediation_tips.append("Upload a higher-resolution photograph.")

        # Determine overall quality status & continuous score (0.0 to 1.0)
        # Weight blur, exposure, contrast
        blur_factor = min(1.0, laplacian_var / (settings.BLUR_LAPLACIAN_THRESHOLD * 2.0))
        lum_diff = abs(mean_luminance - 128.0)
        exposure_factor = max(0.0, 1.0 - (lum_diff / 128.0))
        contrast_factor = min(1.0, rms_contrast / 64.0)
        resolution_factor = 1.0 if resolution_ok else 0.4

        overall_score = float(np.clip(
            0.40 * blur_factor + 0.30 * exposure_factor + 0.20 * contrast_factor + 0.10 * resolution_factor,
            0.0, 1.0
        ))

        if len(rejection_reasons) == 0 and overall_score >= 0.70:
            overall_status = "Good Quality"
        elif len(rejection_reasons) <= 1 and (is_low_contrast or (not is_blurry and not is_underexposed and not is_overexposed)):
            overall_status = "Acceptable Quality"
            if not remediation_tips:
                remediation_tips.append("Image is acceptable for analysis, but higher lighting or focus may yield higher confidence.")
        else:
            overall_status = "Poor Quality"

        return {
            "blur_score": round(laplacian_var, 2),
            "is_blurry": is_blurry,
            "mean_luminance": round(mean_luminance, 2),
            "is_underexposed": is_underexposed,
            "is_overexposed": is_overexposed,
            "rms_contrast": round(rms_contrast, 2),
            "is_low_contrast": is_low_contrast,
            "width": width,
            "height": height,
            "resolution_ok": resolution_ok,
            "overall_status": overall_status,
            "overall_score": round(overall_score, 3),
            "rejection_reasons": rejection_reasons,
            "remediation_tips": remediation_tips
        }

