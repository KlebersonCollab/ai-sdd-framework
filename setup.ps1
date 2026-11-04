# ==============================================================================
# AI-SDD Framework | Universal One-Liner Installer (PowerShell)
# Repository: https://github.com/KlebersonCollab/ai-sdd-framework
# ==============================================================================

[CmdletBinding()]
param(
    [string]$Repo = "KlebersonCollab/ai-sdd-framework",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🛡️  ==========================================================" -ForegroundColor Cyan
Write-Host "    AI-SDD Framework | Spec Driven Development Runtime       " -ForegroundColor White
Write-Host "    Instalador Universal One-Liner (GitHub Archive)           " -ForegroundColor DarkCyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Pré-requisitos
Write-Host "🔍 [1/6] Verificando pré-requisitos do ambiente..." -ForegroundColor Yellow

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ [ERRO] Node.js (v18+) não foi encontrado no PATH." -ForegroundColor Red
    Write-Host "   O AI-SDD Framework requer Node.js para executar seus sensores de integridade e o Cockpit." -ForegroundColor DarkYellow
    Write-Host "   Instale o Node.js em: https://nodejs.org/" -ForegroundColor DarkYellow
    exit 1
}

$nodeVersion = & node -v
Write-Host "   ✓ Node.js detectado: $nodeVersion" -ForegroundColor Green

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️ [AVISO] Git não encontrado no PATH. Algumas funções de pre-commit podem não funcionar." -ForegroundColor DarkYellow
}

$targetDir = (Get-Location).Path
Write-Host "   ✓ Diretório de destino: $targetDir" -ForegroundColor Green

# 2. Inicializar Git caso não exista
if (-not (Test-Path (Join-Path $targetDir ".git"))) {
    Write-Host "⚡ [2/6] Inicializando repositório Git..." -ForegroundColor Yellow
    try {
        & git init --quiet
        Write-Host "   ✓ Repositório Git inicializado com sucesso." -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ Não foi possível inicializar o Git automaticamente." -ForegroundColor DarkYellow
    }
} else {
    Write-Host "⚡ [2/6] Repositório Git já existente." -ForegroundColor Green
}

# 3. Baixar arquivo Zip do GitHub
$archiveUrl = "https://github.com/$Repo/archive/refs/heads/$Branch.zip"
$tempId = [System.Guid]::NewGuid().ToString("N")
$tempZip = Join-Path $env:TEMP "ai-sdd-$tempId.zip"
$tempExtract = Join-Path $env:TEMP "ai-sdd-extract-$tempId"

Write-Host "📦 [3/6] Baixando runtime do GitHub ($Repo @ $Branch)..." -ForegroundColor Yellow
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $archiveUrl -OutFile $tempZip -UseBasicParsing
    Write-Host "   ✓ Download concluído com sucesso." -ForegroundColor Green
} catch {
    Write-Host "❌ [ERRO] Falha ao baixar o arquivo de $archiveUrl" -ForegroundColor Red
    Write-Host "   Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Extrair e Copiar Componentes Canônicos (Update-Safe)
Write-Host "📂 [4/6] Extraindo e instalando governança canônica..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force
    $extractedFolder = Get-ChildItem -Path $tempExtract -Directory | Select-Object -First 1

    if (-not $extractedFolder) {
        throw "Diretório extraído não encontrado no arquivo temporário."
    }

    $sourceRoot = $extractedFolder.FullName

    # Copiar .agents/ preservando a memória se já existir
    $destAgents = Join-Path $targetDir ".agents"
    $existingMemoryFile = Join-Path $destAgents "memory\memory_graph.jsonl"
    $memoryBackup = $null

    if (Test-Path $existingMemoryFile) {
        $memoryBackup = Get-Content $existingMemoryFile -Raw
        Write-Host "   🛡️ Grafo de memória pré-existente preservado." -ForegroundColor DarkCyan
    }

    # Copiar .agents
    $sourceAgents = Join-Path $sourceRoot ".agents"
    if (Test-Path $sourceAgents) {
        Copy-Item -Path $sourceAgents -Destination $targetDir -Recurse -Force
    }

    # Restaurar backup de memória caso existisse, ou inicializar 100% limpo para projetos novos
    $destMemoryDir = Join-Path $destAgents "memory"
    $destMemoryFile = Join-Path $destMemoryDir "memory_graph.jsonl"
    if (-not (Test-Path $destMemoryDir)) { New-Item -ItemType Directory -Path $destMemoryDir -Force | Out-Null }

    if ($memoryBackup) {
        Set-Content -Path $destMemoryFile -Value $memoryBackup -Encoding UTF8 -NoNewline
        Write-Host "   🛡️ Grafo de memória pré-existente preservado." -ForegroundColor DarkCyan
    } else {
        Set-Content -Path $destMemoryFile -Value "" -Encoding UTF8 -NoNewline
        Write-Host "   🧠 Grafo de memória inicializado limpo (0 entidades/relação herdadas)." -ForegroundColor Green
    }

    # Copiar arquivos de governança para raiz
    $canonicalRootFiles = @("AGENTS.md", "DESIGN.md", "CLAUDE.md", ".cursorrules", ".windsurfrules", ".clinerules")
    foreach ($file in $canonicalRootFiles) {
        $srcFile = Join-Path $sourceRoot $file
        if (Test-Path $srcFile) {
            Copy-Item -Path $srcFile -Destination (Join-Path $targetDir $file) -Force
            Write-Host "   ✓ $file sincronizado." -ForegroundColor Green
        }
    }

    # Copiar diretório .github se necessário
    $sourceGithub = Join-Path $sourceRoot ".github"
    if (Test-Path $sourceGithub) {
        $destGithub = Join-Path $targetDir ".github"
        if (-not (Test-Path $destGithub)) { New-Item -ItemType Directory -Path $destGithub -Force | Out-Null }
        $copilotSource = Join-Path $sourceGithub "copilot-instructions.md"
        if (Test-Path $copilotSource) {
            Copy-Item -Path $copilotSource -Destination (Join-Path $destGithub "copilot-instructions.md") -Force
        }
    }

    Write-Host "   ✓ Runtime e regras canônicas instalados." -ForegroundColor Green
} finally {
    # Limpeza de arquivos temporários
    if (Test-Path $tempZip) { Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue }
    if (Test-Path $tempExtract) { Remove-Item -Path $tempExtract -Recurse -Force -ErrorAction SilentlyContinue }
}

# 5. Inicialização de Especificações (.specs) & Sensores
Write-Host "⚙️  [5/6] Configurando especificações e auto-descoberta..." -ForegroundColor Yellow

$specsDir = Join-Path $targetDir ".specs"
if (Test-Path (Join-Path $targetDir ".specs")) {
    Write-Host "   🛡️ [SPECS PRESERVADAS] Diretório .specs/ pré-existente foi mantido intacto." -ForegroundColor DarkCyan
} else {
    # Detectar se o projeto possui manifesto de código (Brownfield)
    $manifests = @("package.json", "Cargo.toml", "pyproject.toml", "go.mod", "pom.xml", "build.gradle")
    $isBrownfield = $false
    foreach ($m in $manifests) {
        if (Test-Path (Join-Path $targetDir $m)) {
            $isBrownfield = $true
            break
        }
    }

    if ($isBrownfield) {
        Write-Host "   🔎 Código pré-existente detectado. Executando Auto-Discovery..." -ForegroundColor Cyan
        & node (Join-Path $targetDir ".agents\scripts\auto-discover.js")
    } else {
        Write-Host "   🌱 Projeto novo detectado. Inicializando esqueleto canônico (.specs/)..." -ForegroundColor Cyan
        & node (Join-Path $targetDir ".agents\scripts\verify-sdd-integrity.js") --bootstrap
    }
}

# 6. Instalar Pre-commit Hooks
Write-Host "🔒 [6/6] Instalando sensores pre-commit de integridade e drift..." -ForegroundColor Yellow
try {
    & node (Join-Path $targetDir ".agents\scripts\install-hooks.js")
} catch {
    Write-Host "   ⚠️ Não foi possível instalar os hooks pre-commit automaticamente." -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "🎉 ==========================================================" -ForegroundColor Green
Write-Host "    AI-SDD Framework Instalado com Sucesso!                 " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Comandos úteis para o seu projeto:" -ForegroundColor Cyan
Write-Host "  • Iniciar Cockpit Web:     node .agents/scripts/serve-dashboard.js" -ForegroundColor White
Write-Host "  • Auditar Integridade:     node .agents/scripts/verify-sdd-integrity.js" -ForegroundColor White
Write-Host "  • Verificar Spec Drift:    node .agents/scripts/check-spec-drift.js --working-tree" -ForegroundColor White
Write-Host "  • Relatório de Drift:      node .agents/scripts/generate-drift-report.js <id>" -ForegroundColor White
Write-Host "  • Revisão Fria (Goldfish): node .agents/scripts/run-spec-review.js <id>" -ForegroundColor White
Write-Host "  • Criar Nova Feature:      node .agents/scripts/create-feature.js <id> --title '<Título>'" -ForegroundColor White
Write-Host ""
Write-Host "Agora inicie seu assistente de IA (Antigravity, Cursor, Windsurf, Claude Code)." -ForegroundColor Yellow
Write-Host "O assistente lerá automaticamente o AGENTS.md e executará o ciclo SDD." -ForegroundColor Yellow
Write-Host ""
