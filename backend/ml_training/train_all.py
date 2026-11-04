"""
Medi Consult - Module Level Trainer Runner
"""
import sys
from pathlib import Path

# Add backend directory to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from train_all_models import train_all_models

if __name__ == "__main__":
    train_all_models()

