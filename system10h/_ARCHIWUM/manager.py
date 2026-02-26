import os
import datetime
import shutil
import re
import sys

# KONFIGURACJA
PLAN_FILE = "plan.md"
BACKUP_DIR = "_HISTORY_LOGS"

def ensure_backup_dir():
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)

def create_backup():
    ensure_backup_dir()
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_path = os.path.join(BACKUP_DIR, f"plan_backup_{timestamp}.md")
    shutil.copy(PLAN_FILE, backup_path)
    return backup_path

def read_plan():
    if not os.path.exists(PLAN_FILE):
        print(f"❌ Błąd: Nie znaleziono pliku {PLAN_FILE}")
        sys.exit(1)
    with open(PLAN_FILE, 'r', encoding='utf-8') as f:
        return f.read()

def save_plan(content):
    create_backup()
    with open(PLAN_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Plan zaktualizowany (kopia zapasowa utworzona).")

def get_section_content(content, section_header):
    """Pobiera treść sekcji na podstawie nagłówka, np. '## ✅ DZISIAJ'"""
    # Proste dopasowanie: od nagłówka do następnego '---' lub końca pliku
    pattern = re.compile(rf"({re.escape(section_header)}.*?)(?=\n---|$)", re.DOTALL)
    match = pattern.search(content)
    if match:
        return match.group(1)
    return None

def update_section(content, section_header, new_body):
    """Podmienia treść sekcji"""
    pattern = re.compile(rf"({re.escape(section_header)}).*?(?=\n---|$)", re.DOTALL)
    replacement = f"{section_header}\n{new_body}\n"
    
    if pattern.search(content):
        return pattern.sub(replacement, content)
    else:
        # Jeśli sekcja nie istnieje, dodaj ją na końcu (fallback)
        return content + f"\n\n---\n\n{replacement}"

def routine_start_day():
    print("\n☀️  DZIEŃ DOBRY! ODPRAWA PORANNA")
    print("---------------------------------")
    
    energia = input("🔋 Poziom energii [1-10]: ")
    
    print("\n🎯 PLANOWANIE ZADAŃ (TOP 3)")
    zadania = []
    for i in range(1, 4):
        z = input(f"   Zadanie {i}: ")
        zadania.append(z)
    
    # Budowanie nowej sekcji
    new_section = f"**Energia:** {energia}/10\n\n"
    for i, z in enumerate(zadania, 1):
        status = "[ ]"
        # Sprawdzamy czy użytkownik wpisał coś sensownego
        if not z.strip():
            z = "..."
        new_section += f"{i}. {status} {z}\n"
        
    content = read_plan()
    new_content = update_section(content, "## ✅ DZISIAJ", new_section)
    save_plan(new_content)
    print("\n🚀 Powodzenia! Twój plan.md jest gotowy.")

def routine_end_day():
    print("\n🌙  PODSUMOWANIE DNIA")
    print("---------------------")
    
    content = read_plan()
    today_section = get_section_content(content, "## ✅ DZISIAJ")
    
    if today_section:
        print("\nTwoje zadania z dziś:")
        print(today_section)
    
    win = input("\n🏆 Twój WIN dnia (co się udało?): ")
    blocker = input("🚧 Twój BLOCKER (co cię zatrzymało?): ")
    
    # Tutaj można by dodać logowanie do jakiegoś dziennika, 
    # na razie tylko wyświetlamy zachętę.
    
    print("\nDzięki! Pamiętaj, żeby przenieść niezrobione zadania na jutro ręcznie lub jutro rano.")
    
    # Opcjonalnie: oznaczenie w pliku (skomplikowane regexy), na razie prosta wersja MVP
    
def main():
    while True:
        print("\n--- SYSTEM 10h+ PLAN MANAGER ---")
        print("1. ☀️ Aktualizuję plan dnia (Rano)")
        print("2. 🌙 Podsumowanie dnia (Wieczór)")
        print("3. Wyjście")
        
        choice = input("\nWybierz opcję (1-3): ")
        
        if choice == '1':
            routine_start_day()
        elif choice == '2':
            routine_end_day()
        elif choice == '3':
            break
        else:
            print("Nieznana opcja.")

if __name__ == "__main__":
    main()
