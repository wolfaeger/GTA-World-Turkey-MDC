#define AppName "Mobile Data Computer - GTA World TR"
#define AppVersion "1.0.0"
#define AppPublisher "Mobile Data Computer - GTA World TR"
#define AppExe "Mobile Data Computer - GTA World TR.exe"
#define SourceDir "..\dist\win-unpacked"

[Setup]
AppId={{8F2C41B7-6D3A-4E58-9C10-7A5B2D9E4F31}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
UninstallDisplayIcon={app}\{#AppExe}
UninstallDisplayName={#AppName}
OutputDir=Output
OutputBaseFilename=Mobile-Data-Computer-GTA-World-TR-Setup-{#AppVersion}
SetupIconFile=..\build\icon.ico
Compression=lzma2/max
SolidCompression=yes
WizardStyle=classic
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes
CloseApplications=yes

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[Tasks]
Name: "desktopicon"; Description: "Masaüstü kısayolu oluştur"; GroupDescription: "Ek kısayollar:"
Name: "startmenuicon"; Description: "Başlat menüsü kısayolu oluştur"; GroupDescription: "Ek kısayollar:"; Flags: checkedonce

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExe}"; IconFilename: "{app}\build\icon.ico"; Tasks: startmenuicon
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; IconFilename: "{app}\build\icon.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExe}"; Description: "{#AppName} uygulamasını başlat"; Flags: nowait postinstall skipifsilent
