#!/usr/bin/env bash
# ==============================================================================
# AI-SDD Framework | Universal One-Liner Installer (POSIX Bash)
# Repository: https://github.com/KlebersonCollab/ai-sdd-framework
# ==============================================================================

set -eo pipefail

REPO="${SDD_REPO:-KlebersonCollab/ai-sdd-framework}"
BRANCH="${SDD_BRANCH:-main}"

# Cores ANSI
CYAN='\033[0;36m'
WHITE='\033[1;37m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e ""
echo -e "${CYAN}🛡️  ==========================================================${NC}"
echo -e "${WHITE}    AI-SDD Framework | Spec Driven Development Runtime       ${NC}"
echo -e "${CYAN}    Instalador Universal One-Liner (GitHub Archive)           ${NC}"
echo -e "${CYAN}==========================================================${NC}"
echo -e ""

# 1. Verificar Pré-requisitos
echo -e "${YELLOW}🔍 [1/6] Verificando pré-requisitos do ambiente...${NC}"

if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}❌ [ERRO] Node.js (v18+) não foi encontrado no PATH.${NC}"
    echo -e "${YELLOW}   O AI-SDD Framework requer Node.js para executar seus sensores de integridade e o Cockpit.${NC}"
    echo -e "${YELLOW}   Instale o Node.js em: https://nodejs.org/${NC}"
    exit 1
fi

NODE_VER=$(node -v)
echo -e "${GREEN}   ✓ Node.js detectado: ${NODE_VER}${NC}"

if ! command -v git >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ [AVISO] Git não encontrado no PATH. Algumas funções de pre-commit podem não funcionar.${NC}"
fi

TARGET_DIR="$(pwd)"
echo -e "${GREEN}   ✓ Diretório de destino: ${TARGET_DIR}${NC}"

# 2. Inicializar Git caso não exista
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚡ [2/6] Inicializando repositório Git...${NC}"
    if command -v git >/dev/null 2>&1; then
        git init -q
        echo -e "${GREEN}   ✓ Repositório Git inicializado com sucesso.${NC}"
    fi
else
    echo -e "${GREEN}⚡ [2/6] Repositório Git já existente.${NC}"
fi

# 3. Baixar arquivo Zip do GitHub
TMP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'ai-sdd-setup')
trap 'rm -rf "$TMP_DIR"' EXIT

ARCHIVE_URL="https://github.com/${REPO}/archive/refs/heads/${BRANCH}.zip"
ZIP_PATH="${TMP_DIR}/ai-sdd.zip"

echo -e "${YELLOW}📦 [3/6] Baixando runtime do GitHub (${REPO} @ ${BRANCH})...${NC}"

if command -v curl >/dev/null 2>&1; then
    curl -fsSL "${ARCHIVE_URL}" -o "${ZIP_PATH}"
elif command -v wget >/dev/null 2>&1; then
    wget -q "${ARCHIVE_URL}" -O "${ZIP_PATH}"
else
    echo -e "${RED}❌ [ERRO] Nem curl nem wget foram encontrados para download.${NC}"
    exit 1
fi

echo -e "${GREEN}   ✓ Download concluído com sucesso.${NC}"

# 4. Extrair e Copiar Componentes Canônicos (Update-Safe)
echo -e "${YELLOW}📂 [4/6] Extraindo e instalando governança canônica...${NC}"

EXTRACT_DIR="${TMP_DIR}/extracted"
mkdir -p "${EXTRACT_DIR}"

if command -v unzip >/dev/null 2>&1; then
    unzip -q "${ZIP_PATH}" -d "${EXTRACT_DIR}"
elif command -v python3 >/dev/null 2>&1; then
    python3 -m zipfile -e "${ZIP_PATH}" "${EXTRACT_DIR}"
else
    echo -e "${RED}❌ [ERRO] 'unzip' ou 'python3' é necessário para extrair o runtime.${NC}"
    exit 1
fi

SRC_ROOT=$(find "${EXTRACT_DIR}" -mindepth 1 -maxdepth 1 -type d | head -n 1)

if [ -z "${SRC_ROOT}" ] || [ ! -d "${SRC_ROOT}" ]; then
    echo -e "${RED}❌ [ERRO] Diretório raiz do pacote extraído não foi encontrado.${NC}"
    exit 1
fi

# Preservar memória existente se houver
EXISTING_MEM="${TARGET_DIR}/.agents/memory/memory_graph.jsonl"
MEM_BACKUP=""
if [ -f "${EXISTING_MEM}" ]; then
    MEM_BACKUP=$(cat "${EXISTING_MEM}")
    echo -e "${CYAN}   🛡️ Grafo de memória pré-existente preservado.${NC}"
fi

# Copiar .agents/
if [ -d "${SRC_ROOT}/.agents" ]; then
    mkdir -p "${TARGET_DIR}/.agents"
    cp -R "${SRC_ROOT}/.agents/"* "${TARGET_DIR}/.agents/"
fi

# Restaurar memória existente se houver, ou inicializar 100% limpa para novos projetos
mkdir -p "${TARGET_DIR}/.agents/memory"
if [ -n "${MEM_BACKUP}" ]; then
    echo "${MEM_BACKUP}" > "${EXISTING_MEM}"
    echo -e "${CYAN}   🛡️ Grafo de memória pré-existente preservado.${NC}"
else
    : > "${EXISTING_MEM}"
    echo -e "${GREEN}   🧠 Grafo de memória inicializado limpo (0 entidades herdadas).${NC}"
fi

# Copiar arquivos de governança canônica na raiz
ROOT_FILES=("AGENTS.md" "DESIGN.md" ".cursorrules" ".windsurfrules" ".clinerules")
for f in "${ROOT_FILES[@]}"; do
    if [ -f "${SRC_ROOT}/${f}" ]; then
        cp -f "${SRC_ROOT}/${f}" "${TARGET_DIR}/${f}"
        echo -e "${GREEN}   ✓ ${f} sincronizado.${NC}"
    fi
done

# Copiar .github/copilot-instructions.md se existir
if [ -f "${SRC_ROOT}/.github/copilot-instructions.md" ]; then
    mkdir -p "${TARGET_DIR}/.github"
    cp -f "${SRC_ROOT}/.github/copilot-instructions.md" "${TARGET_DIR}/.github/copilot-instructions.md"
fi

echo -e "${GREEN}   ✓ Runtime e regras canônicas instalados.${NC}"

# 5. Configurar Especificações (.specs) & Sensores
echo -e "${YELLOW}⚙️  [5/6] Configurando especificações e auto-descoberta...${NC}"

if [ -d "${TARGET_DIR}/.specs" ]; then
    echo -e "${CYAN}   🛡️ [SPECS PRESERVADAS] Diretório .specs/ pré-existente foi mantido intacto.${NC}"
else
    # Detectar se o projeto possui manifesto de código (Brownfield)
    IS_BROWNFIELD=false
    MANIFESTS=("package.json" "Cargo.toml" "pyproject.toml" "go.mod" "pom.xml" "build.gradle")
    for m in "${MANIFESTS[@]}"; do
        if [ -f "${TARGET_DIR}/${m}" ]; then
            IS_BROWNFIELD=true
            break
        fi
    done

    if [ "$IS_BROWNFIELD" = true ]; then
        echo -e "${CYAN}   🔎 Código pré-existente detectado. Executando Auto-Discovery...${NC}"
        node "${TARGET_DIR}/.agents/scripts/auto-discover.js"
    else
        echo -e "${CYAN}   🌱 Projeto novo detectado. Inicializando esqueleto canônico (.specs/)...${NC}"
        node "${TARGET_DIR}/.agents/scripts/verify-sdd-integrity.js" --bootstrap
    fi
fi

# 6. Instalar Pre-commit Hooks
echo -e "${YELLOW}🔒 [6/6] Instalando sensores pre-commit de integridade e drift...${NC}"
if [ -f "${TARGET_DIR}/.agents/scripts/install-hooks.js" ]; then
    node "${TARGET_DIR}/.agents/scripts/install-hooks.js" || true
fi

echo -e ""
echo -e "${GREEN}🎉 ==========================================================${NC}"
echo -e "${WHITE}    AI-SDD Framework Instalado com Sucesso!                 ${NC}"
echo -e "${GREEN}==========================================================${NC}"
echo -e ""
echo -e "${CYAN}Comandos úteis para o seu projeto:${NC}"
echo -e "  • Iniciar Cockpit Web:     node .agents/scripts/serve-dashboard.js"
echo -e "  • Auditar Integridade:     node .agents/scripts/verify-sdd-integrity.js"
echo -e "  • Verificar Spec Drift:    node .agents/scripts/check-spec-drift.js --working-tree"
echo -e "  • Criar Nova Feature:      node .agents/scripts/create-feature.js <id> --title '<Título>'"
echo -e ""
echo -e "${YELLOW}Agora inicie seu assistente de IA (Antigravity, Cursor, Windsurf, Claude Code).${NC}"
echo -e "${YELLOW}O assistente lerá automaticamente o AGENTS.md e executará o ciclo SDD.${NC}"
echo -e ""
