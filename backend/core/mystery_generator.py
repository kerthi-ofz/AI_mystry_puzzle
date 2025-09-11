import requests
import json

class MysteryGenerator:
    def __init__(self, model_name="llama3.2:3b", base_url="http://localhost:11434"):
        self.model_name = model_name
        self.base_url = base_url
    
    def generate(self, prompt: str, max_new_tokens=300) -> str:
        try:
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.8,
                    "top_p": 0.95,
                    "num_predict": max_new_tokens
                }
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "")
            else:
                raise Exception(f"Ollama API error: {response.status_code}")
                
        except Exception as e:
            raise Exception(f"Error generating with Ollama: {str(e)}")
