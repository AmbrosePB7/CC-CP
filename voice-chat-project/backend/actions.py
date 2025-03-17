import os
import webbrowser

def perform_action(text):
    if "open notepad" in text.lower():
        os.system("notepad.exe")
        return "Opened Notepad"
    elif "open browser" in text.lower():
        webbrowser.open("https://www.google.com")
        return "Opened Web Browser"
    else:
        return "No action performed"
