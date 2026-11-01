def get_standard_response(msg: str, lang: str, ctx: dict) -> tuple[str, list, list]:
    cond_name = ctx.get("class_name") or ctx.get("primary_name") or "skin lesion"
    cond_code = ctx.get("class_code") or ctx.get("primary_code") or ""
    conf_pct = float(ctx.get("confidence") or 0.0)
    risk_cat = ctx.get("risk_category") or "Unknown"

    context_intro = ""
    if cond_code:
        context_intro = f"*(Regarding Active Case: **{cond_name}** | Confidence: **{conf_pct*100:.0f}%** | Tier: **{risk_cat}**)*\n\n"

    if any(k in msg for k in ["further", "next step", "what to do", "solution", "what do", "next", "treatment", "care", "cure"]):
        if lang == "kn":
            body = (
                "**ಮುಂದಿನ ಕ್ರಮಗಳು ಮತ್ತು ವೈದ್ಯಕೀಯ ಪರಿಹಾರಗಳು:**\n\n"
                "1. **ಚರ್ಮರೋಗ ತಜ್ಞರ ನೇರ ಭೇಟಿ:** AI ಕೇವಲ ಪ್ರಾಥಮಿಕ ಸ್ಕ್ರೀನಿಂಗ್ ನೀಡುತ್ತದೆ. ಖಚಿತ ರೋಗನಿರ್ಣಯಕ್ಕಾಗಿ ಪ್ರಮಾಣೀಕೃತ ಚರ್ಮರೋಗ ತಜ್ಞರನ್ನು ಭೇಟಿ ಮಾಡಿ ಡೆರ್ಮಟೊಸ್ಕೋಪಿ ಪರೀಕ್ಷೆ ಮಾಡಿಸಿಕೊಳ್ಳಿ.\n\n"
                "2. **ಫೋಟೋ ದಾಖಲೀಕರಣ:** ಪ್ರತಿ 3-4 ವಾರಗಳಿಗೊಮ್ಮೆ ಸ್ಪಷ್ಟವಾದ ಫೋಟೋ ತೆಗೆದು ಇರಿಸಿಕೊಳ್ಳಿ.\n\n"
                "3. **ಏನು ಮಾಡಬಾರದು:** ಮಚ್ಚೆ ಅಥವಾ ಗಾಯವನ್ನು ಉಗುರಿನಿಂದ ಕೆರೆಯಬೇಡಿ ಅಥವಾ ಯಾವುದೇ ಆಮ್ಲೀಯ ಮನೆಮದ್ದುಗಳನ್ನು ಹಚ್ಚಬೇಡಿ.\n\n"
                "4. **ಎಚ್ಚರಿಕೆಯ ಲಕ್ಷಣಗಳು:** ಮಚ್ಚೆಯಿಂದ ರಕ್ತಸ್ರಾವವಾದರೆ ಅಥವಾ ಬಣ್ಣ ಬದಲಾದರೆ ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.\n\n"
                "5. **ಸೂರ್ಯನ ರಕ್ಷಣೆ:** ಪ್ರತಿದಿನ SPF 50+ ಸನ್‌ಸ್ಕ್ರೀನ್ ಬಳಸಿ."
            )
        elif lang == "hi":
            body = (
                "**आगे के कदम और उपचार समाधान:**\n\n"
                "1. **चर्म रोग विशेषज्ञ से परामर्श:** अंतिम पुष्टि के लिए क्लिनिकल डर्मेटोस्कोपी जांच अनिवार्य है।\n\n"
                "2. **फोटो से निगरानी:** तिल या मस्से की हर 3-4 सप्ताह में स्पष्ट फोटो लें।\n\n"
                "3. **क्या न करें:** तिल को कभी भी खुरचें नहीं और न ही घरेलू एसिड से हटाने की कोशिश करें।\n\n"
                "4. **खतरे के संकेत:** यदि तिल से खून बहता है या तेजी से बढ़ता है, तो तुरंत डॉक्टर से मिलें।\n\n"
                "5. **धूप से बचाव:** रोजाना ब्रॉड-स्पेक्ट्रम SPF 50+ सनस्क्रीन लगाएं।"
            )
        elif lang == "te":
            body = (
                "**తదుపరి చర్యలు మరియు పరిష్కారాలు:**\n\n"
                "1. **చర్మవ్యాధి నిపుణుడిని సంప్రదించండి:** ఖచ్చితమైన నిర్ధారణ కోసం డెర్మటోస్కోపీ పరీక్ష చేయించుకోండి.\n\n"
                "2. **రెగ్యులర్ ఫోటో మానిటరింగ్:** ప్రతి 3-4 వారాలకు ఒకసారి ఆ మచ్చను ఫోటో తీయండి.\n\n"
                "3. **చేయకూడని పనులు:** మచ్చను గోకడం లేదా ఇంట్లోనే తొలగించడానికి ప్రయత్నించడం చేయవద్దు.\n\n"
                "4. **ప్రమాదకర సంకేతాలు:** రక్తం కారడం లేదా వేగంగా పెరగడం జరిగితే వెంటనే వైద్యుడిని సంప్రదించండి.\n\n"
                "5. **ఎండ నుంచి రక్షణ:** ప్రతిరోజూ SPF 50+ సన్‌స్క్రీన్ ఉపయోగించండి."
            )
        else:
            body = (
                "Here is your recommended clinical roadmap for **next steps and solutions**:\n\n"
                "1. **Clinical Dermoscopic Verification:** AI provides preliminary screening; schedule an in-person dermoscopy with a dermatologist.\n\n"
                "2. **Serial Photographic Monitoring:** Take a high-resolution smartphone photo once every 3–4 weeks with a coin or ruler for scale.\n\n"
                "3. **What NOT to Do:** Never pick, scratch, or apply home DIY acids to skin spots.\n\n"
                "4. **Watch for Red Flags:** Seek prompt care if you notice spontaneous bleeding, rapid enlargement within 4 weeks, or color darkening.\n\n"
                "5. **Photoprotection:** Apply broad-spectrum SPF 50+ sunscreen daily."
            )

    elif any(k in msg for k in ["healthy", "normal", "why clinical review", "clear skin", "no disease"]):
        body = (
            "**Regarding Healthy / Normal Skin Photos:**\n\n"
            "• DermAI is trained specifically on pathological lesions. When you photograph uniform, healthy skin without an isolated lesion, the system identifies **0% lesion area** and confirms **'Normal Healthy Skin (No Lesion Detected)'**.\n\n"
            "• If your skin looks uniform and has no changing spots or pain, **no medical treatment or doctor visit is required!**"
        )

    elif any(k in msg for k in ["heatmap", "heat map", "grad-cam", "red color", "blue color"]):
        body = (
            "**What the Grad-CAM++ Attention Heatmap Tells You:**\n\n"
            "• 🔴 **Red / Warm Colors:** Areas of peak neural activation (irregular pigment networks, asymmetry, or atypical margins).\n"
            "• 🟡 **Yellow / Green:** Surrounding lesion border and transition zones.\n"
            "• 🔵 **Blue / Cool Colors:** Background healthy skin that the AI intentionally ignored."
        )

    elif any(k in msg for k in ["abcde", "asymmetry", "border", "danger sign"]):
        body = (
            "**The ABCDE Melanoma Detection Guidelines:**\n\n"
            "• **A - Asymmetry:** One half doesn't match the other.\n"
            "• **B - Border:** Edges are irregular, ragged, or blurred.\n"
            "• **C - Color:** Color variegation (tan, brown, black, red, white).\n"
            "• **D - Diameter:** Larger than 6 mm (pencil eraser).\n"
            "• **E - Evolving:** Rapidly changing in size, shape, elevation, or itching/bleeding."
        )

    elif any(k in msg for k in ["biopsy", "punch", "shave", "test"]):
        body = (
            "**What Happens During a Dermatological Biopsy?**\n\n"
            "1. **Numbing:** The area is locally anesthetized with lidocaine (virtually painless).\n"
            "2. **Sample Removal:** A shave, punch (circular core), or complete excisional biopsy takes 5–10 minutes.\n"
            "3. **Microscopic Pathology:** Sent to a dermatopathologist with definitive results in 3–7 business days."
        )

    else:
        body = (
            "**Hello! I am DermAura AI**, your specialized clinical dermatology decision copilot.\n\n"
            "You can ask me about **ANY skin condition or random disease**, including:\n"
            "• **Acne & Breakouts** (Blackheads, cystic pimples, salicylic acid, retinoids)\n"
            "• **Eczema & Atopic Dermatitis** (Ceramide barrier repair, itch relief)\n"
            "• **Psoriasis** (Silver scales, plaque treatments, phototherapy)\n"
            "• **Fungal Infections & Ringworm** (Tinea, athlete's foot, antifungals)\n"
            "• **Hives & Allergic Rashes** (Urticaria, antihistamines, emergency signs)\n"
            "• **Vitiligo & Depigmentation** (Repigmentation, sun protection)\n"
            "• **Shingles** (Herpes zoster, antivirals within 72 hours, nerve pain)\n"
            "• **Warts, Rosacea, Scabies, Melasma, Impetigo**, or your current screening analysis!\n\n"
            "What skin condition or question would you like help with?"
        )

    actions = [
        "What is the solution for acne?",
        "How to treat eczema and dry skin?",
        "What to do for fungal ringworm?",
        "What are the ABCDE melanoma signs?"
    ]

    followups = [
        "What should I do further?",
        "Explain the Grad-CAM heatmap",
        "How does a skin biopsy work?"
    ]

    return context_intro + body, actions, followups

