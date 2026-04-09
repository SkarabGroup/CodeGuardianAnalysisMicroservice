import sys
import os
from strands import Agent

def main():
    print('Docker started')

    # 1. Recupero il percorso passato al container
    if len(sys.argv) < 2:
        print("Errore: nessun percorso repository fornito.")
        sys.exit(1)

    target_dir = sys.argv[1]
    print(f"Directory target da analizzare: {target_dir}")

    # 2. Controllo che il volume sia stato montato e la cartella esista
    if not os.path.exists(target_dir):
        print(f"Errore: la directory {target_dir} non esiste all'interno del container.")
        sys.exit(1)

    # 3. Scansione ricorsiva per stampare tutti i file
    print(f"--- Inizio scansione file in {target_dir} ---")
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            # Opzionale: ignora cartelle nascoste come .git per non inquinare l'output
            if '.git' in root:
                continue
                
            percorso_completo = os.path.join(root, file)
            print(percorso_completo)
            
    print("--- Fine scansione ---")

if __name__ == "__main__":
    main()