/**
 * missions.js — Server-side ONLY mission data.
 * NEVER exposed to the client. Added to .gitignore.
 * Imported only by server.js.
 */

const MISSIONS = [
  {
    id: 1, name: "MISSION 01: RECON", shortName: "Recon",
    story: "MegaCorp server detected at 192.168.0.1. Scan for vulnerabilities before infiltrating.",
    time: 300,
    tools: [{ name: "nmap", desc: "Network scanner" }, { name: "ping", desc: "Host checker" }, { name: "whois", desc: "Domain lookup" }],
    steps: [
      {
        obj: "Ping the target server",
        hint: "Use: ping 192.168.0.1",
        keys: ["ping 192.168.0.1", "ping 192.168.0.1 -c 4"],
        responses: ["Pinging 192.168.0.1...\nReply from 192.168.0.1: bytes=32 time=12ms TTL=64\nHost is ALIVE. Target confirmed."],
        xp: 80
      },
      {
        obj: "Scan open ports with nmap",
        hint: "Use: nmap 192.168.0.1",
        keys: ["nmap 192.168.0.1", "nmap -sV 192.168.0.1", "nmap -p- 192.168.0.1"],
        responses: ["Starting Nmap scan...\nPORT     STATE  SERVICE\n22/tcp   open   ssh\n80/tcp   open   http\n443/tcp  open   https\n3306/tcp open   mysql\nScan complete. 4 vulnerabilities detected."],
        xp: 100
      },
      {
        obj: "Lookup domain info with whois",
        hint: "Use: whois megacorp.com",
        keys: ["whois megacorp.com", "whois megacorp", "whois 192.168.0.1"],
        responses: ["WHOIS lookup: megacorp.com\nRegistrar: ShadowNet Inc.\nOwner: [REDACTED]\nAdmin Email: admin@megacorp.com\nSSH Credentials: Partially exposed in old record."],
        xp: 120
      }
    ]
  },
  {
    id: 2, name: "MISSION 02: INFILTRATION", shortName: "Infiltration",
    story: "Target server is live. Crack the SSH login and gain initial access to MegaCorp systems.",
    time: 360,
    tools: [{ name: "ssh", desc: "Secure Shell" }, { name: "hydra", desc: "Brute-force tool" }, { name: "crack", desc: "Password cracker" }],
    steps: [
      {
        obj: "Connect via SSH to target",
        hint: "Use: ssh admin@192.168.0.1",
        keys: ["ssh admin@192.168.0.1", "ssh admin@megacorp.com"],
        responses: ["Connecting to 192.168.0.1...\nssh: Connection established.\nAuthentication required.\nPermission denied (publickey, password)."],
        xp: 80
      },
      {
        obj: "Run hydra to brute-force password",
        hint: "Use: hydra -l admin -P wordlist.txt 192.168.0.1 ssh",
        keys: ["hydra", "hydra -l admin", "hydra admin"],
        responses: ["[HYDRA] Loading wordlist... 14,344 entries\n[HYDRA] Trying combinations...\n[HYDRA] [22][ssh] host: 192.168.0.1  login: admin  password: ********\n[HYDRA] 1 valid password found. Credential stored."],
        xp: 150
      },
      {
        obj: "Login with cracked credentials",
        hint: "Use: login admin",
        keys: ["login admin", "login admin megacorp"],
        responses: ["Authenticating as admin...\n\nWelcome, admin. MegaCorp Internal Network — Access Level 1"],
        xp: 200
      }
    ]
  },
  {
    id: 3, name: "MISSION 03: ESCALATION", shortName: "Privilege Escalation",
    story: "You're in as a low-level admin. Escalate privileges to gain ROOT access.",
    time: 360,
    tools: [{ name: "whoami", desc: "Check identity" }, { name: "find", desc: "File finder" }, { name: "sudo", desc: "Superuser exec" }, { name: "exploit", desc: "Run exploit" }],
    steps: [
      {
        obj: "Check your current user identity",
        hint: "Use: whoami",
        keys: ["whoami", "id", "who am i"],
        responses: ["admin\nuid=1001(admin) gid=1001(admin) groups=1001(admin)\nNOTE: Not root. Privilege escalation required."],
        xp: 60
      },
      {
        obj: "Find SUID binaries for exploit",
        hint: "Use: find / -perm -4000",
        keys: ["find / -perm -4000", "find -perm -4000", "find / -suid"],
        responses: ["Searching for SUID binaries...\n/usr/bin/passwd\n/usr/bin/sudo\n/usr/local/bin/megacorp_util  \u2190 VULNERABLE (CVE-SHADOW-001)\n/usr/bin/newgrp\n\nVulnerable binary identified: /usr/local/bin/megacorp_util"],
        xp: 120
      },
      {
        obj: "Exploit the vulnerable binary",
        hint: "Use: exploit megacorp_util",
        keys: ["exploit megacorp_util", "exploit /usr/local/bin/megacorp_util", "exploit"],
        responses: ["Running exploit CVE-SHADOW-001...\n[*] Checking binary...\n[*] Overwriting return address...\n[*] Spawning shell...\n\nroot@megacorp:~# \n\nROOT ACCESS ACHIEVED. Full system control granted."],
        xp: 250
      }
    ]
  },
  {
    id: 4, name: "MISSION 04: EXTRACTION", shortName: "Data Extraction",
    story: "As root, locate and extract MegaCorp's classified data files. Don't trigger the IDS.",
    time: 420,
    tools: [{ name: "ls", desc: "List files" }, { name: "cd", desc: "Change dir" }, { name: "cat", desc: "Read file" }, { name: "decrypt", desc: "Decrypt data" }, { name: "wget", desc: "Transfer file" }],
    steps: [
      {
        obj: "Navigate to the secret directory",
        hint: "Use: cd /root/classified",
        keys: ["cd /root/classified", "cd /root", "cd classified"],
        responses: ["Changed directory.\nroot@megacorp:/root/classified# \nContents: [ENCRYPTED FILES DETECTED]"],
        xp: 80
      },
      {
        obj: "List the classified files",
        hint: "Use: ls -la",
        keys: ["ls -la", "ls", "ls -l", "ls -a"],
        responses: ["total 48\n-rw------- 1 root root  8192 Jan 14 03:22 MEGACORP_SECRETS.enc\n-rw------- 1 root root 12288 Jan 14 03:22 USER_DATA_2M.enc\n-rw------- 1 root root  4096 Jan 14 03:22 KEYFILE.bin\n\n3 encrypted files found. Decryption key located."],
        xp: 80
      },
      {
        obj: "Decrypt the secret file",
        hint: "Use: decrypt MEGACORP_SECRETS.enc",
        keys: ["decrypt megacorp_secrets.enc", "decrypt megacorp_secrets", "decrypt"],
        responses: ["Decrypting MEGACORP_SECRETS.enc with KEYFILE.bin...\n\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 100%\n\nDECRYPTED CONTENTS:\n> MegaCorp has been harvesting user data since 2019\n> 2.1 million records illegally sold to DataBroker Inc.\n> Project SHADOW: Mass surveillance contract \u2014 $4.2B\n\nData package ready for exfiltration."],
        xp: 200
      },
      {
        obj: "Exfiltrate data to secure server",
        hint: "Use: wget --upload MEGACORP_SECRETS.enc agent0.darknet",
        keys: ["wget --upload", "wget agent0.darknet", "wget"],
        responses: ["Connecting to agent0.darknet...\nUploading MEGACORP_SECRETS.enc...\n\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 100%\nTransfer complete. 8.19 KB uploaded.\nEvidence secured. The world will know the truth."],
        xp: 220
      }
    ]
  },
  {
    id: 5, name: "MISSION 05: GHOST MODE", shortName: "Cover Tracks",
    story: "MegaCorp security has detected unusual activity. Erase all traces before they catch you.",
    time: 240,
    tools: [{ name: "rm", desc: "Delete files" }, { name: "clear", desc: "Clear logs" }, { name: "history -c", desc: "Erase history" }, { name: "logout", desc: "Disconnect" }],
    steps: [
      {
        obj: "Delete all log files",
        hint: "Use: rm -rf /var/log/megacorp/*",
        keys: ["rm -rf /var/log/megacorp/*", "rm -rf /var/log/*", "rm /var/log/megacorp"],
        responses: ["Deleting logs...\nrm: /var/log/megacorp/access.log \u2014 DELETED\nrm: /var/log/megacorp/auth.log \u2014 DELETED\nrm: /var/log/megacorp/intrusion.log \u2014 DELETED\nAll 47 log entries purged."],
        xp: 120
      },
      {
        obj: "Clear command history",
        hint: "Use: history -c",
        keys: ["history -c", "history -c && exit", "clear history"],
        responses: ["Clearing bash history...\nhistory: .bash_history \u2014 WIPED\nAll 312 commands erased from record."],
        xp: 100
      },
      {
        obj: "Terminate all active sessions",
        hint: "Use: logout",
        keys: ["logout", "exit", "disconnect"],
        responses: ["Terminating session...\nClosing all 3 active connections...\nSSH tunnel destroyed.\nIP spoofing layer removed.\nVPN chain dissolved.\n\nAgent Zero has gone GHOST. No trace remains."],
        xp: 150
      }
    ]
  }
];

module.exports = MISSIONS;
