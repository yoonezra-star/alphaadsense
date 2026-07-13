$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$assetDir = Join-Path $root "public\assets"
New-Item -ItemType Directory -Force -Path $assetDir | Out-Null

Add-Type -AssemblyName System.Drawing

function New-Brush($hex) {
  New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($hex))
}

function New-Pen($hex, $width) {
  New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($hex), $width)
}

function New-RoundedPath($rect, $radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
  $path.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
  $path.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
  $path.CloseFigure()
  $path
}

function Add-Card($g, $x, $y, $w, $h, $number, $title, $body, $colorHex) {
  $inkBrush = New-Brush "#152033"
  $mutedBrush = New-Brush "#526174"
  $whiteBrush = New-Brush "#ffffff"
  $linePen = New-Pen "#d8e2ee" 3
  $colorBrush = New-Brush $colorHex
  $cardFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Bold)
  $bodyFont = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Regular)

  $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
  $path = New-RoundedPath $rect 18
  $g.FillPath($whiteBrush, $path)
  $g.DrawPath($linePen, $path)
  $g.FillEllipse($colorBrush, $x + 24, $y + 24, 54, 54)
  $g.DrawString($number, $cardFont, $whiteBrush, $x + 42, $y + 33)
  $g.DrawString($title, $cardFont, $inkBrush, $x + 24, $y + 96)
  $textRect = New-Object System.Drawing.RectangleF -ArgumentList ([single]($x + 24)), ([single]($y + 140)), ([single]($w - 48)), ([single]($h - 154))
  $g.DrawString($body, $bodyFont, $mutedBrush, $textRect)

  $inkBrush.Dispose()
  $mutedBrush.Dispose()
  $whiteBrush.Dispose()
  $linePen.Dispose()
  $colorBrush.Dispose()
  $cardFont.Dispose()
  $bodyFont.Dispose()
}

function New-Diagram($fileName, $title, $subtitle, $steps, $footer) {
  $width = 1400
  $height = 760
  $bmp = New-Object System.Drawing.Bitmap $width, $height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  $bgBrush = New-Brush "#f7fafc"
  $inkBrush = New-Brush "#152033"
  $mutedBrush = New-Brush "#526174"
  $bluePen = New-Pen "#2563eb" 4
  $titleFont = New-Object System.Drawing.Font("Segoe UI", 42, [System.Drawing.FontStyle]::Bold)
  $subFont = New-Object System.Drawing.Font("Segoe UI", 21, [System.Drawing.FontStyle]::Regular)
  $smallFont = New-Object System.Drawing.Font("Segoe UI", 17, [System.Drawing.FontStyle]::Regular)

  $g.FillRectangle($bgBrush, 0, 0, $width, $height)
  $g.DrawString($title, $titleFont, $inkBrush, 80, 66)
  $g.DrawString($subtitle, $subFont, $mutedBrush, 84, 128)

  $x = 90
  $colors = @("#2563eb", "#0f9f6e", "#d97706", "#475569")
  for ($i = 0; $i -lt $steps.Count; $i++) {
    Add-Card $g $x 285 285 280 ([string]($i + 1)) $steps[$i].Title $steps[$i].Body $colors[$i % $colors.Count]
    if ($i -lt $steps.Count - 1) {
      $g.DrawLine($bluePen, $x + 300, 425, $x + 330, 425)
    }
    $x += 315
  }

  $g.DrawString($footer, $smallFont, $mutedBrush, 88, 650)

  $path = Join-Path $assetDir $fileName
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

  $bgBrush.Dispose()
  $inkBrush.Dispose()
  $mutedBrush.Dispose()
  $bluePen.Dispose()
  $titleFont.Dispose()
  $subFont.Dispose()
  $smallFont.Dispose()
  $g.Dispose()
  $bmp.Dispose()
}

New-Diagram "approval-workflow.png" "Alpha AdSense Workflow" "A practical route from domain setup to review readiness." @(
  @{ Title = "Structure"; Body = "Menus, about, contact, and policy pages." },
  @{ Title = "Content"; Body = "Original guides, examples, and internal links." },
  @{ Title = "Policy"; Body = "Cookies, privacy, restricted topics, and trust signals." },
  @{ Title = "Apply"; Body = "Index checks, sitemap, HTTPS, and final review." }
) "approval-ready content hub"

New-Diagram "site-structure-audit.png" "Site Structure Audit" "Check whether reviewers and readers can move through the site naturally." @(
  @{ Title = "Home"; Body = "Clear purpose, main categories, and current guides." },
  @{ Title = "Category"; Body = "Reading order, representative articles, no empty areas." },
  @{ Title = "Article"; Body = "Useful body, related links, tables, and checklists." },
  @{ Title = "Footer"; Body = "Privacy, cookies, contact, terms, and editorial policy." }
) "navigation quality improves user trust"

New-Diagram "low-value-rewrite.png" "Low Value Rewrite Map" "Improve weak content by adding judgment, examples, and clear next steps." @(
  @{ Title = "Merge"; Body = "Combine repeated short posts into one useful guide." },
  @{ Title = "Add Proof"; Body = "Include criteria, examples, tables, and records." },
  @{ Title = "Link"; Body = "Connect related guides and policy pages." },
  @{ Title = "Recheck"; Body = "Review mobile layout, indexing, and final risks." }
) "depth matters more than raw post count"

New-Diagram "policy-pages-map.png" "Policy Page Map" "Separate each trust page by purpose so readers can verify the site quickly." @(
  @{ Title = "Privacy"; Body = "Inquiry data, contact path, and user rights." },
  @{ Title = "Cookies"; Body = "Ad cookies, personalized ads, and opt-out choices." },
  @{ Title = "Disclaimer"; Body = "No approval guarantee and information limits." },
  @{ Title = "Editorial"; Body = "Content standards, ad safety, and corrections." }
) "always reachable from the footer"

New-Diagram "deployment-search-console.png" "Deploy and Index Flow" "Use a stable custom domain before requesting AdSense review." @(
  @{ Title = "Domain"; Body = "Gabia nameservers point to Cloudflare." },
  @{ Title = "Pages"; Body = "GitHub deploys to Cloudflare Pages." },
  @{ Title = "HTTPS"; Body = "Custom domain and www load correctly." },
  @{ Title = "Index"; Body = "Submit sitemap and inspect key URLs." }
) "apply after HTTPS and sitemap are stable"

New-Diagram "article-format.png" "Approval Friendly Article" "A useful article solves one reader problem with evidence and next actions." @(
  @{ Title = "Problem"; Body = "Name the exact reader situation first." },
  @{ Title = "Criteria"; Body = "Explain how to judge good and bad states." },
  @{ Title = "Steps"; Body = "Give a sequence readers can follow." },
  @{ Title = "Checklist"; Body = "Finish with review points and related links." }
) "usable information beats generic summaries"

New-Diagram "rejection-response-map.png" "Rejection Response Map" "Translate review messages into concrete site fixes." @(
  @{ Title = "Content"; Body = "Improve originality, depth, and duplication issues." },
  @{ Title = "Navigation"; Body = "Fix menus, empty categories, and broken links." },
  @{ Title = "Access"; Body = "Check DNS, HTTPS, redirects, and uptime." },
  @{ Title = "Policy"; Body = "Remove risky topics and misleading wording." }
) "record every fix before reapplying"

New-Diagram "seven-day-checklist.png" "7 Day Pre-Apply Log" "Use the final week to stabilize the site instead of rushing new posts." @(
  @{ Title = "Day 1-2"; Body = "Required pages, menus, and footer links." },
  @{ Title = "Day 3-4"; Body = "Representative guides, examples, and duplicates." },
  @{ Title = "Day 5"; Body = "Mobile layout, tables, buttons, and links." },
  @{ Title = "Day 6-7"; Body = "Sitemap, indexing, policy wording, and final notes." }
) "submit only after the basics stay stable"
