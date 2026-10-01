import sys

print("=" * 50)
print("VÉRIFICATION DE L'ENVIRONNEMENT PYTHON")
print("=" * 50)

# 1. Version Python
print(f"\nPython : {sys.version}")

# 2. Vérification de Pandas
try:
    import pandas as pd
    print(f"Pandas : {pd.__version__} ✅")
except ImportError:
    print("Pandas : non installé ❌")

# 3. Vérification de psycopg2
try:
    import psycopg2
    print(f"psycopg2 : {psycopg2.__version__} ✅")
except ImportError:
    print("psycopg2 : non installé ❌")

print("\n" + "=" * 50)
print("FIN DE LA VÉRIFICATION")
print("=" * 50)