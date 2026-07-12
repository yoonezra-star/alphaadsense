$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$assetDir = Join-Path $root "public\assets"
New-Item -ItemType Directory -Force -Path $assetDir | Out-Null

Add-Type -AssemblyName System.Drawing

$width = 1400
$height = 760
$bmp = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$bg = [System.Drawing.ColorTranslator]::FromHtml("#f7fafc")
$ink = [System.Drawing.ColorTranslator]::FromHtml("#152033")
$muted = [System.Drawing.ColorTranslator]::FromHtml("#526174")
$blue = [System.Drawing.ColorTranslator]::FromHtml("#2563eb")
$green = [System.Drawing.ColorTranslator]::FromHtml("#0f9f6e")
$amber = [System.Drawing.ColorTranslator]::FromHtml("#d97706")
$line = [System.Drawing.ColorTranslator]::FromHtml("#d8e2ee")

$g.Clear($bg)

$titleFont = New-Object System.Drawing.Font("Segoe UI", 44, [System.Drawing.FontStyle]::Bold)
$bodyFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Regular)
$smallFont = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Regular)
$cardFont = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Bold)

$inkBrush = New-Object System.Drawing.SolidBrush($ink)
$mutedBrush = New-Object System.Drawing.SolidBrush($muted)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$blueBrush = New-Object System.Drawing.SolidBrush($blue)
$greenBrush = New-Object System.Drawing.SolidBrush($green)
$amberBrush = New-Object System.Drawing.SolidBrush($amber)
$linePen = New-Object System.Drawing.Pen($line, 3)

$g.DrawString("Alpha AdSense", $titleFont, $inkBrush, 80, 70)
$g.DrawString("Approval, writing, policy checks, and monetization in one clear workflow.", $bodyFont, $mutedBrush, 84, 135)

$steps = @(
  @{n="1"; t="Structure"; d="Menus, about, contact, policy pages"},
  @{n="2"; t="Content"; d="Original guides and internal links"},
  @{n="3"; t="Policy"; d="Cookies, privacy, restricted content"},
  @{n="4"; t="Apply"; d="Index checks and review readiness"}
)

$x = 90
foreach ($s in $steps) {
  $rect = New-Object System.Drawing.Rectangle($x, 300, 270, 250)
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $radius = 18
  $path.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
  $path.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
  $path.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
  $path.CloseFigure()
  $g.FillPath($whiteBrush, $path)
  $g.DrawPath($linePen, $path)

  $circleBrush = if ($s.n -eq "1") { $blueBrush } elseif ($s.n -eq "2") { $greenBrush } elseif ($s.n -eq "3") { $amberBrush } else { $blueBrush }
  $circleX = $x + 26
  $numberX = $x + 45
  $textX = $x + 30
  $g.FillEllipse($circleBrush, $circleX, 326, 56, 56)
  $g.DrawString($s.n, $cardFont, $whiteBrush, $numberX, 337)
  $g.DrawString($s.t, $cardFont, $inkBrush, $textX, 410)
  $textRect = New-Object System.Drawing.RectangleF($textX, 460, 210, 70)
  $g.DrawString($s.d, $smallFont, $mutedBrush, $textRect)

  if ($x -lt 960) {
    $lineStart = $x + 282
    $lineEnd = $x + 330
    $g.DrawLine((New-Object System.Drawing.Pen($blue, 4)), $lineStart, 425, $lineEnd, 425)
  }
  $x += 315
}

$g.DrawString("approval-ready content hub", $smallFont, $mutedBrush, 88, 650)

$path = Join-Path $assetDir "approval-workflow.png"
$bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
