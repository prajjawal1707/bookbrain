#!/usr/bin/env bash
set -e
YELLOW='\033[1;33m'; GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'

echo ""
echo -e "${YELLOW}  ██████╗  ██████╗  ██████╗ ██╗  ██╗██████╗ ██████╗  █████╗ ██╗███╗   ██╗${NC}"
echo -e "${YELLOW}  ██╔══██╗██╔═══██╗██╔═══██╗██║ ██╔╝██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║${NC}"
echo -e "${YELLOW}  ██████╔╝██║   ██║██║   ██║█████╔╝ ██████╔╝██████╔╝███████║██║██╔██╗ ██║${NC}"
echo -e "${YELLOW}  ██╔══██╗██║   ██║██║   ██║██╔═██╗ ██╔══██╗██╔══██╗██╔══██║██║██║╚██╗██║${NC}"
echo -e "${YELLOW}  ██████╔╝╚██████╔╝╚██████╔╝██║  ██╗██████╔╝██║  ██║██║  ██║██║██║ ╚████║${NC}"
echo -e "${YELLOW}  ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝${NC}"
echo -e "${CYAN}         Student Edition — Free AI (Ollama / Groq / OpenRouter)${NC}"
echo ""

# Check dependencies
command -v python3 &>/dev/null || { echo -e "${RED}Python 3 required. Install from python.org${NC}"; exit 1; }
command -v node    &>/dev/null || { echo -e "${RED}Node.js required. Install from nodejs.org${NC}"; exit 1; }
command -v npm     &>/dev/null || { echo -e "${RED}npm required. Install Node.js from nodejs.org${NC}"; exit 1; }
echo -e "${GREEN}✓ Python $(python3 --version | cut -d' ' -f2) · Node $(node --version) · npm $(npm --version)${NC}"

# Setup backend
echo -e "\n${CYAN}→ Setting up backend...${NC}"
cd backend
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${YELLOW}⚠  Created backend/.env — please edit it and set AI_PROVIDER + your key${NC}"
fi
[ ! -d "venv" ] && python3 -m venv venv
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
pip install -r requirements.txt -q
echo -e "${GREEN}✓ Backend ready${NC}"
cd ..

# Setup frontend
echo -e "\n${CYAN}→ Setting up frontend...${NC}"
cd frontend && npm install --silent && cd ..
echo -e "${GREEN}✓ Frontend ready${NC}"

# Start
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  BookBrain is starting...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}App:${NC}    http://localhost:3000"
echo -e "  ${YELLOW}API:${NC}    http://localhost:8000"
echo -e "  ${YELLOW}Docs:${NC}   http://localhost:8000/docs"
echo -e "\n  Press ${RED}Ctrl+C${NC} to stop\n"

cd backend
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

sleep 2
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

sleep 3
command -v open      &>/dev/null && open      http://localhost:3000
command -v xdg-open  &>/dev/null && xdg-open  http://localhost:3000

trap "echo ''; echo -e '${YELLOW}Stopping…${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e '${GREEN}Done.${NC}'; exit 0" INT
wait
