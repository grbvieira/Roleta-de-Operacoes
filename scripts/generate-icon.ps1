# Recreates the app's code-native +/x brand mark at the usual Windows icon sizes.
# The vector reference is app/assets/app-icon.svg. No PowerPoint image is edited.
Add-Type -AssemblyName System.Drawing
$iconProjectRoot = Split-Path -Parent $PSScriptRoot
$iconSizes = @(16, 24, 32, 48, 64, 128, 256)
$iconImages = @()
foreach ($iconSize in $iconSizes) {
    $iconBitmap = New-Object System.Drawing.Bitmap($iconSize, $iconSize)
    $iconGraphics = [System.Drawing.Graphics]::FromImage($iconBitmap)
    $iconGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $iconGraphics.ScaleTransform(($iconSize / 256.0), ($iconSize / 256.0))
    $iconPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $iconPath.AddArc(8, 8, 96, 96, 180, 90)
    $iconPath.AddArc(152, 8, 96, 96, 270, 90)
    $iconPath.AddArc(152, 152, 96, 96, 0, 90)
    $iconPath.AddArc(8, 152, 96, 96, 90, 90)
    $iconPath.CloseFigure()
    $iconBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(101, 59, 159))
    $iconGraphics.FillPath($iconBrush, $iconPath)
    $iconPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 20)
    $iconGraphics.DrawLine($iconPen, 44, 108, 120, 108)
    $iconGraphics.DrawLine($iconPen, 82, 70, 82, 146)
    $iconPen.Width = 16
    $iconGraphics.DrawLine($iconPen, 150, 132, 202, 184)
    $iconGraphics.DrawLine($iconPen, 202, 132, 150, 184)
    $iconStream = New-Object System.IO.MemoryStream
    $iconBitmap.Save($iconStream, [System.Drawing.Imaging.ImageFormat]::Png)
    $iconImages += ,($iconStream.ToArray())
    $iconStream.Dispose()
    $iconPen.Dispose()
    $iconBrush.Dispose()
    $iconPath.Dispose()
    $iconGraphics.Dispose()
    $iconBitmap.Dispose()
}
$iconOutput = Join-Path $iconProjectRoot 'app\assets\app.ico'
$iconFile = [System.IO.File]::Create($iconOutput)
$iconWriter = New-Object System.IO.BinaryWriter($iconFile)
try {
    $iconWriter.Write([uint16]0)
    $iconWriter.Write([uint16]1)
    $iconWriter.Write([uint16]$iconSizes.Length)
    $iconOffset = 6 + 16 * $iconSizes.Length
    for ($iconIndex = 0; $iconIndex -lt $iconSizes.Length; $iconIndex++) {
        $iconDimension = if ($iconSizes[$iconIndex] -eq 256) { 0 } else { $iconSizes[$iconIndex] }
        $iconWriter.Write([byte]$iconDimension)
        $iconWriter.Write([byte]$iconDimension)
        $iconWriter.Write([byte]0)
        $iconWriter.Write([byte]0)
        $iconWriter.Write([uint16]1)
        $iconWriter.Write([uint16]32)
        $iconWriter.Write([uint32]$iconImages[$iconIndex].Length)
        $iconWriter.Write([uint32]$iconOffset)
        $iconOffset += $iconImages[$iconIndex].Length
    }
    foreach ($iconImage in $iconImages) { $iconWriter.Write([byte[]]$iconImage) }
} finally {
    $iconWriter.Dispose()
    $iconFile.Dispose()
}
Write-Output $iconOutput
