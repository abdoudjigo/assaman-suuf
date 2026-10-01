import json
import math

with open("mongo_agriculture_1990_2005.json", encoding="utf-8") as f:
    data = json.load(f)

def nettoyer(valeur):
    if isinstance(valeur, float) and math.isnan(valeur):
        return None
    return valeur

for doc in data:
    for cle in doc:
        doc[cle] = nettoyer(doc[cle])

with open("mongo_agriculture_clean.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False)

print(f"{len(data)} documents nettoyés.")
