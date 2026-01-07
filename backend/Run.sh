# 1. Create a virtual environment named 'venv'
python3 -m venv venv

# 2. Activate the virtual environment
source venv/bin/activate

# 3. Upgrade pip
pip install --upgrade pip

# 4. Install requirements
pip install -r requirements.txt

# 5. Run FastAPI server
uvicorn Server:app --reload --host 0.0.0.0 --port 5000
