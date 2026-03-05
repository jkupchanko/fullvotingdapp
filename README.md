# PBO Full Voting dApp
A simple end-to-end demo that lets you deploy a Move contract on Supra Testnet and interact with it from a React (Vite + TS) frontend. This guide is copy-paste friendly.

## Prerequisites 
- Git
- Node.js 18+ and npm
- Docker Desktop (Compose v2)
- (Optional) Cursor or VS 

> You’ll spin up the SupraCLI in Docker, publish a Move package, then run the frontend.

## Get Started

1. Clone & open

```
git clone https://github.com/Supra-Labs/PBO-Full-Voting-dapp
cd PBO-Full-Voting-dapp
code .
```

2. Frontend deps

```
cd frontend
npm install
```

> You’ll run the frontend later, keep this terminal handy.

3. Start SupraCLI (Docker)

> In a new terminal, start the CLI container via Compose (reads file from stdin):

```
curl https://raw.githubusercontent.com/supra-labs/supra-dev-hub/refs/heads/main/Scripts/cli/compose.yaml | docker compose -f - up -d

Enter the container:
docker exec -it supra_cli /bin/bash
```

4. Initialize a Move package inside the container:

```
supra move tool init --package-dir /supra/move_workspace/exampleContract --name exampleContract
```

**Note:** When prompted, overwrite the generated Move.toml later with your addresses (see below).


5. Setup the account.

- Create local profiles (owner & voter)

```
supra profile new owner
supra profile new voter
```

- Fund both from faucet (Supra Testnet):

```
supra move account fund-with-faucet --profile owner --rpc-url https://rpc-testnet.supra.com

supra move account fund-with-faucet --profile voter --rpc-url https://rpc-testnet.supra.com
```

- List profiles & addresses:

```
supra profile -l
```

> Copy the owner and voter addresses, you’ll need them in Move.toml and the frontend .env.

- Activate the signer (owner):

```
supra profile activate owner
```

6. Update Move.toml
Open `/supra/move_workspace/exampleContract/Move.toml` and set your addresses.Example (structure may vary by template):

```
[package]
name = "exampleContract"
version = "0.0.1"

[addresses]
owner = "0xOWNER_ADDRESS"
voter = "0xVOTER_ADDRESS"

[dependencies]
# (Keep existing dependencies as generated)
```

**Save the file.**

7. Publish the smart contract Still inside the container:

```
supra move tool publish --package-dir /supra/move_workspace/exampleContract --rpc-url https://rpc-testnet.supra.com
```

This returns the published package (module) address. Keep it, your frontend needs it as `VITE_MODULE_ADDR.`

8. Configure the frontend
Back in your host terminal in frontend/, create a .env:

#### frontend/.env

```
VITE_SUPRA_RPC=https://rpc-testnet.supra.com
VITE_MODULE_ADDR=0xYOUR_PUBLISHED_MODULE_ADDR   # from publish output
VITE_DEV_PRIVATE_KEY=0xYOUR_OWNER_PRIVATE_KEY   # see command below
VITE_VOTER_ADDR=0xYOUR_VOTER_ADDRESS     
```

#### from `supra profile -l`
Get private keys (inside the container):
`supra profile -l -r`

Use the Owner private key for `VITE_DEV_PRIVATE_KEY.`

> Security note: .env is for local dev only, don’t commit secrets to Git.

9. Run the dApp
From frontend/:
`npm run dev`
Open: `http://localhost:5173`

Click through the UI to create proposals, vote, and read results against Supra Testnet.

```
Repo structure (high level)
PBO-Full-Voting-dapp/
├─ frontend/                  # React + Vite + TypeScript dApp
│  ├─ src/                    # UI + Supra SDK wiring
│  ├─ .env.example            # sample env (add if not present)
│  └─ ...
└─ (Move workspace via container)
   └─ /supra/move_workspace/exampleContract   # contract you initialized
```

## Common commands (reference)

### Container lifecycle
docker compose down              # stop CLI container(s)
docker compose ps                # list containers
docker logs supra_cli            # view logs

### Profiles & keys (inside container)

```
supra profile new <name>
supra profile activate <name>
supra profile -l
supra profile -l -r              # show private keys (dev only)
```

### Funding (inside container)

```
supra move account fund-with-faucet --profile <name> --rpc-url https://rpc-testnet.supra.com
```

### Build/Publish (inside container)

```
supra move tool publish --package-dir /supra/move_workspace/exampleContract --rpc-url https://rpc-testnet.supra.com
```

## Troubleshooting

- docker: command not found / Compose errors
 Install/update Docker Desktop (Compose v2 included). Re-run the curl → compose command.


- permission denied with Docker
 On Linux, add your user to the docker group or run with elevated privileges.


- profile not found or wrong signer
 Run supra profile -l and supra profile activate owner again.


- RPC/Network errors
 Double-check VITE_SUPRA_RPC=https://rpc-testnet.supra.com and that accounts are faucet-funded.


- Frontend can’t find module/addresses
 Ensure VITE_MODULE_ADDR (published package) and VITE_VOTER_ADDR are correct. Restart npm run dev after editing .env.


**Notes**
This project is for demo/dev use. Don’t use test keys in production.

If you customize contract names or addresses, update both Move.toml and the frontend .env accordingly.
