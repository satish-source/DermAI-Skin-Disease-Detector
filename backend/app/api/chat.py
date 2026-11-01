import os
import json
import urllib.request
import urllib.error
from typing import Optional, List
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Dermatology AI Clinical Chatbot"])

class ChatMessageRequest(BaseModel):
    message: str
    language: Optional[str] = "en"  # "en", "kn", "hi", "te"
    api_key: Optional[str] = None
    case_context: Optional[dict] = None

class ChatResponse(BaseModel):
    reply: str
    source: str  # "gemini_live" or "dermai_knowledge_base"
    suggested_actions: List[str]
    suggested_followups: List[str]
    disclaimer: str

# -------------------------------------------------------------
# Comprehensive Dermatological Knowledge Base for Random Conditions
# -------------------------------------------------------------
RANDOM_DISEASE_SOLUTIONS = {
    "acne": {
        "title": "Acne Vulgaris (Pimples, Blackheads & Cystic Acne)",
        "overview": "Acne is an inflammatory condition of the pilosebaceous units caused by excess sebum, follicular hyperkeratinization, and *Cutibacterium acnes* bacterial proliferation.",
        "solutions": [
            "**Over-The-Counter (OTC) Active Ingredients:**\n  - **Benzoyl Peroxide (2.5% to 5%):** Destroys acne-causing bacteria and reduces inflammation.\n  - **Salicylic Acid (BHA 1% to 2%):** Unclogs deep pores and exfoliates dead keratin.\n  - **Adapalene (0.1% topical retinoid):** Normalizes skin cell turnover and prevents microcomedones.",
            "**Daily Routine & Self-Care:**\n  - Cleanse twice daily with a gentle, non-comedogenic foaming cleanser.\n  - Never squeeze, pick, or pop blemishes (leads to post-inflammatory erythema, hyperpigmentation, and pitted scars).\n  - Use oil-free, non-comedogenic sunscreen (gel/fluid formulation).",
            "**Prescription Clinical Solutions:**\n  - Moderate to severe cystic acne may require topical clindamycin, oral doxycycline, or oral isotretinoin under strict dermatologist supervision."
        ]
    },
    "eczema": {
        "title": "Eczema / Atopic Dermatitis (Dry, Itchy & Inflamed Skin)",
        "overview": "Eczema is a chronic inflammatory skin condition marked by an impaired epidermal moisture barrier (filaggrin deficiency), immune dysregulation, and persistent pruritus.",
        "solutions": [
            "**Immediate Barrier Repair & Moisture Therapy:**\n  - Apply thick ceramide-rich creams or ointments (e.g. petroleum jelly, CeraVe, Cetaphil) within 3 minutes of bathing (\"Soak and Seal\" technique).\n  - Take short, lukewarm showers (5–10 minutes); avoid hot water which depletes natural skin lipids.",
            "**Anti-Inflammatory & Itch Relief:**\n  - **Mild OTC Hydrocortisone (1%):** Apply to red, itchy flare-ups for 5–7 days.\n  - **Oral Non-Sedating Antihistamines:** (Cetirizine, Fexofenadine) to break the \"itch-scratch\" cycle.\n  - **Cold Compresses:** Apply a cool, damp cloth to instantly soothe intense burning/itching.",
            "**Triggers to Strictly Avoid:**\n  - Synthetic fragrances, sulfates, harsh laundry detergents, wool/scratchy fabrics, and extreme temperature fluctuations.",
            "**Specialist Treatments:**\n  - Topical calcineurin inhibitors (tacrolimus/pimecrolimus), PDE4 inhibitors (crisaborole), or biologic injections (dupilumab) for severe chronic eczema."
        ]
    },
    "psoriasis": {
        "title": "Psoriasis (Plaque Psoriasis & Scalp Psoriasis)",
        "overview": "Psoriasis is an autoimmune, immune-mediated condition that accelerates skin cell life cycles, causing rapid buildup of silvery-white scales and well-demarcated erythematous plaques.",
        "solutions": [
            "**Topical Treatments & Keratolytics:**\n  - **Coal Tar & Salicylic Acid:** Softens and removes thick silvery scales.\n  - **Prescription Corticosteroids + Vitamin D Analogues (Calcipotriol):** Reduces rapid epidermal proliferation and local inflammation.",
            "**Lifestyle & At-Home Relief:**\n  - Daily hydration with heavy urea or salicylic acid moisturizers.\n  - Gentle natural sunlight (moderate UV exposure suppresses hyperactive T-cells), but avoid sunburn.\n  - Minimize stress, alcohol, and smoking, which are known systemic triggers.",
            "**Advanced Dermatologist Options:**\n  - Targeted Narrowband UVB phototherapy, oral immunosuppressants (methotrexate), or targeted monoclonal antibody biologics (IL-17, IL-23, TNF inhibitors)."
        ]
    },
    "fungal": {
        "title": "Fungal Infection / Tinea / Ringworm / Athlete's Foot",
        "overview": "Tinea infections (ringworm, jock itch, tinea versicolor) are caused by dermatophyte fungi that feed on keratin in warm, moist cutaneous areas.",
        "solutions": [
            "**Topical Antifungal Therapy:**\n  - Apply OTC topical antifungals: **Clotrimazole (1%)**, **Terbinafine (1%)**, or **Miconazole (2%)** twice daily.\n  - **Crucial Rule:** Continue applying the antifungal cream for **1 to 2 weeks after the rash appears completely cured** to eliminate microscopic fungal spores.",
            "**Hygiene & Environmental Control:**\n  - Keep the affected area thoroughly washed and bone dry. Use antifungal dusting powders in moisture-prone folds.\n  - Never share towels, clothes, hairbrushes, or bedsheets.\n  - Wear loose, breathable cotton garments.",
            "**When to See a Doctor:**\n  - If the fungal infection affects the scalp (tinea capitis), nails (onychomycosis), or fails to improve within 14 days, prescription oral antifungals (fluconazole, terbinafine, itraconazole) are required."
        ]
    },
    "hives": {
        "title": "Urticaria / Hives (Acute Itchy Wheals & Allergic Swelling)",
        "overview": "Urticaria presents as transient, pruritic, elevated erythematous wheals caused by mast cell degranulation and sudden histamine release in the dermis.",
        "solutions": [
            "**Immediate Medical Relief:**\n  - **Second-Generation Antihistamines:** Take Cetirizine (10mg), Fexofenadine (180mg), or Levocetirizine for non-drowsy, rapid histamine blockade.\n  - **Cool Soothing:** Apply cool compresses or take a cool colloidal oatmeal bath.",
            "**Identify & Eliminate Triggers:**\n  - Common triggers: Medications (NSAIDs, antibiotics), specific foods (shellfish, nuts, dairy), viral infections, insect bites, or heat/friction.",
            "**🚨 EMERGENCY RED FLAG WARNING:**\n  - If hives are accompanied by lip/tongue swelling (angioedema), difficulty breathing, hoarseness, dizziness, or chest tightness, call emergency services immediately (Anaphylaxis risk — requires intramuscular epinephrine)."
        ]
    },
    "vitiligo": {
        "title": "Vitiligo (Autoimmune Depigmentation)",
        "overview": "Vitiligo is an autoimmune condition where the body's immune system mistakenly attacks melanocytes (pigment-producing cells), resulting in smooth, chalky-white patches.",
        "solutions": [
            "**Medical Repigmentation Therapies:**\n  - **Topical Calcineurin Inhibitors (Tacrolimus 0.1%):** Safe for face and neck without causing skin thinning.\n  - **Topical Corticosteroids:** High-potency topical creams for localized macules.\n  - **JAK Inhibitors (Ruxolitinib cream):** Newly FDA-approved topical therapy for non-segmental vitiligo.",
            "**Phototherapy & Protection:**\n  - Narrowband UVB (NB-UVB) phototherapy stimulates dormant melanocyte precursors in hair follicles.\n  - Depigmented skin lacks natural melanin protection: **Meticulous SPF 50+ mineral sunscreen is mandatory** to prevent severe sunburns.",
            "**Cosmetic Camouflage:**\n  - Dermatological self-tanning dyes containing dihydroxyacetone (DHA) provide durable skin tone matching."
        ]
    },
    "shingles": {
        "title": "Shingles / Herpes Zoster (Painful Blistering Rash)",
        "overview": "Shingles is a reactivation of the dormant Varicella-Zoster virus (chickenpox) in a sensory nerve ganglion, producing a characteristic unilateral, dermatomal blistering eruption.",
        "solutions": [
            "**URGENT Medical Action (First 72 Hours):**\n  - **Prescription Oral Antivirals:** (Valacyclovir, Acyclovir, or Famciclovir) MUST be initiated within 72 hours of rash onset to reduce severity and prevent long-term **Post-Herpetic Neuralgia (PHN)**.",
            "**Comfort & Symptom Care:**\n  - Apply cool, moist calamine compresses to weeping blisters.\n  - Keep blisters clean and covered with non-stick sterile gauze to prevent secondary bacterial infection.\n  - Pain relief: Acetaminophen, ibuprofen, or prescribed neuropathic pain agents (gabapentin).",
            "**🚨 RED FLAG:** If blisters appear near the eye, forehead, or tip of the nose (Hutchinson's sign), seek emergency ophthalmology care immediately to protect your eyesight."
        ]
    },
    "rosacea": {
        "title": "Rosacea (Facial Redness, Flushing & Telangiectasia)",
        "overview": "A chronic vascular and inflammatory skin condition affecting the central face (cheeks, nose, forehead), often triggered by Demodex mites, vascular hyper-reactivity, and UV radiation.",
        "solutions": [
            "**Targeted Topicals:**\n  - **Azelaic Acid (10% to 15%):** Reduces inflammatory papules and facial erythema.\n  - **Metronidazole Gel (0.75%):** First-line antimicrobial and anti-inflammatory.\n  - **Ivermectin (1% cream):** Targets Demodex folliculorum mites.",
            "**Identify & Avoid Flush Triggers:**\n  - Spicy foods, hot beverages, alcohol, intense heat/saunas, and harsh chemical scrubs.",
            "**Strict Sun Protection:** Daily broad-spectrum zinc oxide or titanium dioxide mineral sunscreen (chemical sunscreens can cause stinging)."
        ]
    },
    "scabies": {
        "title": "Scabies Infestation (Intense Nocturnal Itching & Burrows)",
        "overview": "A contagious parasitic infestation caused by microscopic *Sarcoptes scabiei* mites burrowing into the stratum corneum to lay eggs.",
        "solutions": [
            "**Medical Cure Protocol:**\n  - **Permethrin Cream (5%):** Apply from the neck down to the soles of the feet, leave on for 8 to 14 hours overnight, then wash off. A second application 7 days later is required to kill newly hatched nymphs.",
            "**Household & Laundry Sterilization:**\n  - Wash all bed linen, towels, and clothing worn in the past 4 days in hot water (60°C) and machine dry on high heat.\n  - All household members and close intimate contacts MUST be treated simultaneously, even if asymptomatic."
        ]
    },
    "warts": {
        "title": "Warts / Verrucae (Human Papillomavirus / HPV)",
        "overview": "Benign epidermal proliferations caused by localized infection of keratinocytes with low-risk strains of Human Papillomavirus (HPV).",
        "solutions": [
            "**Keratolytic Home Treatment:**\n  - **Salicylic Acid (17% to 40%):** Soak the wart in warm water for 5 minutes, gently file dead skin with an emery board, apply salicylic acid, and cover with duct tape.\n  - Continue daily for 8 to 12 weeks for complete viral clearance.",
            "**In-Clinic Removal:**\n  - Cryotherapy with liquid nitrogen (-196°C), electrosurgery, or cantharidin application by a dermatologist."
        ]
    },
    "melasma": {
        "title": "Melasma (Hormonal Facial Hyperpigmentation)",
        "overview": "Acquired hyperpigmentation occurring predominantly on sun-exposed facial areas, driven by estrogen/progesterone fluctuations and UV/visible blue light.",
        "solutions": [
            "**Visible Light & UV Protection:**\n  - Use **tinted mineral sunscreen containing Iron Oxides** (iron oxides block both UV rays and visible blue light that triggers melasma).\n  - Wear wide-brimmed UV hats.",
            "**Pigment Lighteners:**\n  - Topical Azelaic Acid (10-20%), Kojic Acid, Tranexamic Acid, and dermatologist-prescribed triple combination cream (hydroquinone, tretinoin, fluocinolone)."
        ]
    },
    "impetigo": {
        "title": "Impetigo (Contagious Honey-Colored Crusted Sores)",
        "overview": "A superficial bacterial skin infection caused by *Staphylococcus aureus* or *Streptococcus pyogenes*, common in children around mouth and nose.",
        "solutions": [
            "**Topical Antibacterial Care:**\n  - Gently soften and remove crusts with warm water and soap.\n  - Apply prescription **Mupirocin (2%)** or Fusidic acid ointment three times daily for 7 days.",
            "**Hygiene:** Isolate towels, wash hands frequently, and keep child home from school until 24 hours of antibiotic therapy has elapsed."
        ]
    }
}

# -------------------------------------------------------------
# Google Gemini Live API Caller
# -------------------------------------------------------------
def query_google_gemini(prompt: str, api_key: str, language: str = "en", case_context: dict = None) -> Optional[str]:
    """
    Calls Google's live Gemini 2.5 Flash / 1.5 Flash model for clinical dermatological reasoning.
    """
    if not api_key:
        return None

    # Construct clinical system context
    context_str = ""
    if case_context and case_context.get("class_name"):
        context_str = f"Patient's active screening context: Condition={case_context.get('class_name')}, Risk={case_context.get('risk_category')}, Confidence={case_context.get('confidence')}. "

    language_instructions = {
        "en": "Respond in clear, structured, professional English.",
        "kn": "Respond in authentic, grammatically correct Kannada (ಕನ್ನಡ ಲಿಪಿಯಲ್ಲಿ ವಿವರವಾಗಿ ಉತ್ತರಿಸಿ).",
        "hi": "Respond in fluent, compassionate Hindi (हिन्दी में स्पष्ट और विस्तृत उत्तर दें).",
        "te": "Respond in fluent, clear Telugu (తెలుగులో స్పష్టంగా మరియు వివరంగా సమాధానం ఇవ్వండి)."
    }.get(language, "Respond in clear English.")

    system_instruction = (
        "You are 'DermAI Gemini Copilot', a world-class dermatological AI assistant. "
        "The user will ask you about ANY random skin condition, rash, lesion, or general skin disease. "
        f"{context_str}"
        "Your goal is to provide deep, practical, medically grounded guidance following this structured format:\n"
        "1. 📌 **Condition Overview & Clinical Presentation** (What it is, typical symptoms, biological causes)\n"
        "2. 💡 **Immediate Self-Care & Relief Solutions** (Step-by-step home remedies, Dos and Don'ts)\n"
        "3. 💊 **Medical & Pharmacological Treatments** (Active OTC ingredients, standard topical/oral prescription options)\n"
        "4. 🚨 **Red Flag Warning Signs** (When to seek emergency medical attention or urgent dermatologist biopsy)\n"
        "5. ☀️ **Long-term Prevention & Skincare Habits**\n\n"
        f"{language_instructions}\n"
        "Keep the tone empathetic, reassuring, and clinically precise. Always include a brief medical triage disclaimer."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_instruction}\n\nUser Question:\n{prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1000
        }
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                text_part = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if text_part:
                    return text_part.strip()
    except Exception as e:
        # Fallback to gemini-1.5-flash if 2.5 is not accessible
        fallback_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        try:
            req2 = urllib.request.Request(
                fallback_url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req2, timeout=12) as response2:
                res_data2 = json.loads(response2.read().decode("utf-8"))
                candidates2 = res_data2.get("candidates", [])
                if candidates2:
                    text_part2 = candidates2[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if text_part2:
                        return text_part2.strip()
        except Exception:
            return None

    return None

# -------------------------------------------------------------
# Main Chat Routing Endpoint
# -------------------------------------------------------------
@router.post("/chat", response_model=ChatResponse)
def handle_chat_message(req: ChatMessageRequest):
    msg = req.message.lower().strip()
    lang = req.language or "en"
    ctx = req.case_context or {}
    api_key = req.api_key or os.getenv("GEMINI_API_KEY")

    # 1. Check if user configured live Google Gemini API
    if api_key:
        gemini_reply = query_google_gemini(req.message, api_key, lang, ctx)
        if gemini_reply:
            return ChatResponse(
                reply=gemini_reply,
                source="gemini_live",
                suggested_actions=[
                    "What are the red flag danger signs?",
                    "What are the best OTC creams for this?",
                    "How long does recovery usually take?"
                ],
                suggested_followups=[
                    "Explain ABCDE melanoma criteria",
                    "How to prepare for a dermatologist visit?",
                    "Can diet or stress trigger this?"
                ],
                disclaimer="Generated by Gemini 2.5 Clinical AI. DermAI is an educational decision-support tool; always verify with a certified dermatologist."
            )

    # 2. Check built-in Universal Dermatology Knowledge Base for random skin diseases
    matched_disease = None
    for key, data in RANDOM_DISEASE_SOLUTIONS.items():
        if key in msg or (key == "fungal" and any(w in msg for w in ["fungus", "ringworm", "tinea", "athlete"])) or \
           (key == "hives" and any(w in msg for w in ["urticaria", "allergy", "wheal", "welt"])) or \
           (key == "acne" and any(w in msg for w in ["pimple", "blackhead", "whitehead", "breakout"])) or \
           (key == "eczema" and any(w in msg for w in ["dermatitis", "atopic", "itchy dry"])) or \
           (key == "shingles" and any(w in msg for w in ["herpes zoster", "zoster", "blister strip"])) or \
           (key == "scabies" and "mite" in msg) or \
           (key == "warts" and any(w in msg for w in ["wart", "verruca", "hpv"])) or \
           (key == "melasma" and any(w in msg for w in ["chloasma", "dark patch", "pregnancy mask"])):
            matched_disease = data
            break

    if matched_disease:
        title = matched_disease["title"]
        overview = matched_disease["overview"]
        sols = "\n\n".join(matched_disease["solutions"])

        reply_body = (
            f"### 🩺 **DermAura AI Clinical Guide: {title}**\n\n"
            f"**Overview & Causes:**\n{overview}\n\n"
            f"**Recommended Solutions & Treatments:**\n\n{sols}\n\n"
            f"📌 **General Safety Guidance:**\n"
            f"• Avoid aggressive scratching or unverified home acid/chemical peels.\n"
            f"• If lesions bleed, rapidly spread, or cause systemic fever, seek immediate in-person dermatological evaluation."
        )

        # Multilingual prefix/adaptation if requested
        if lang == "kn":
            reply_body = f"**(ಕನ್ನಡ ಆವೃತ್ತಿ)**: {title} ಕುರಿತು ಡರ್ಮ್‌ಔರಾ ಎಐ ಕ್ಲಿನಿಕಲ್ ಪರಿಹಾರಗಳು:\n\n" + reply_body
        elif lang == "hi":
            reply_body = f"**(हिन्दी संस्करण)**: {title} के लिए डर्मऑरा एआई समाधान और उपचार:\n\n" + reply_body
        elif lang == "te":
            reply_body = f"**(తెలుగు వెర్షన్)**: {title} కొరకు డెర్మ్‌ఔరా ఏఐ పరిష్కారాలు మరియు చికిత్స:\n\n" + reply_body

        return ChatResponse(
            reply=reply_body,
            source="dermai_knowledge_base",
            suggested_actions=[
                "What are the red flag danger signs?",
                "What should I do further?",
                "How does a skin biopsy work?"
            ],
            suggested_followups=[
                "What are the ABCDE melanoma signs?",
                "How to protect skin with SPF 50+?",
                "How to prepare for a dermatologist visit?"
            ],
            disclaimer="DermAI Assistant provides educational clinical guidance. Consult a dermatologist for prescription therapies."
        )

    # 3. Standard fallback queries (Next steps, healthy skin, heatmap, ABCDE, biopsy)
    from app.api.chat_legacy import get_standard_response
    reply_text, suggested_actions, suggested_followups = get_standard_response(msg, lang, ctx)

    return ChatResponse(
        reply=reply_text,
        source="dermai_knowledge_base",
        suggested_actions=suggested_actions,
        suggested_followups=suggested_followups,
        disclaimer="DermAI Assistant is an AI-powered educational and clinical decision-support tool. It does not replace formal clinical diagnosis by a licensed dermatologist."
    )
