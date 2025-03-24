from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer

# Load model only when needed (lazily)
model = None
tokenizer = None

# Supported language codes
SUPPORTED_LANGUAGES = {
    "en": "English",
    "fr": "French",
    "es": "Spanish",
    "de": "German",
    "zh": "Chinese",
    "ja": "Japanese",
    "ru": "Russian",
    "ar": "Arabic",
    "hi": "Hindi",
    "pt": "Portuguese",
    "it": "Italian",
}

def get_model():
    """Lazy loading of the translation model"""
    global model, tokenizer
    if model is None or tokenizer is None:
        model_name = "facebook/m2m100_418M"
        tokenizer = M2M100Tokenizer.from_pretrained(model_name)
        model = M2M100ForConditionalGeneration.from_pretrained(model_name)
    return model, tokenizer

def translate_text(text, src_lang="en", target_lang="fr"):
    """Translates text from source to target language."""
    if not text or not text.strip():
        return ""
        
    # Get model and tokenizer
    model, tokenizer = get_model()
    
    # Validate language codes or use defaults
    if src_lang not in SUPPORTED_LANGUAGES:
        src_lang = "en"
    if target_lang not in SUPPORTED_LANGUAGES:
        target_lang = "fr"
    
    # Set source language
    tokenizer.src_lang = src_lang
    
    # Tokenize and translate
    encoded_text = tokenizer(text, return_tensors="pt")
    generated_tokens = model.generate(
        **encoded_text, 
        forced_bos_token_id=tokenizer.get_lang_id(target_lang),
        max_length=200
    )
    
    # Decode the result
    return tokenizer.decode(generated_tokens[0], skip_special_tokens=True)

def get_available_languages():
    """Returns list of available languages for translation"""
    return SUPPORTED_LANGUAGES

if __name__ == "__main__":
    input_text = "Hello, how are you?"
    translated_text = translate_text(input_text, "en", "es")
    print(f"Translated Text: {translated_text}")
