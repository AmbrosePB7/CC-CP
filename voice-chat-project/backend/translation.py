from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer

model_name = "facebook/m2m100_418M"
tokenizer = M2M100Tokenizer.from_pretrained(model_name)
model = M2M100ForConditionalGeneration.from_pretrained(model_name)

def translate_text(text, src_lang="en", target_lang="fr"):
    """Translates text from source to target language."""
    tokenizer.src_lang = src_lang
    encoded_text = tokenizer(text, return_tensors="pt")
    generated_tokens = model.generate(**encoded_text, forced_bos_token_id=tokenizer.get_lang_id(target_lang))
    return tokenizer.decode(generated_tokens[0], skip_special_tokens=True)

if __name__ == "__main__":
    input_text = "Hello, how are you?"
    translated_text = translate_text(input_text, "en", "es")
    print(f"Translated Text: {translated_text}")
