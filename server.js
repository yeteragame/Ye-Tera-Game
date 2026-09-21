const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "vishalminote06@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const dataFile = path.join(__dirname, "data.json");
function readData() {
  if (!fs.existsSync(dataFile)) {
    return { tournaments: [
      {id:1,name:"YE TERA BGMI CUP #01",game:"BGMI",fee:49,prize:5000},
      {id:2,name:"YE TERA FF BATTLE #01",game:"Free Fire",fee:29,prize:3000}
    ], registrations: [] };
  }
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}
function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

app.get("/api/config", (req,res)=>res.json({adminEmail: ADMIN_EMAIL}));
app.get("/api/tournaments", (req,res)=>res.json(readData().tournaments));
app.get("/api/registrations", (req,res)=>{
  if (req.headers["x-admin-key"] !== ADMIN_PASSWORD || !ADMIN_PASSWORD) {
    return res.status(401).json({error:"Unauthorized"});
  }
  res.json(readData().registrations);
});

app.post("/api/admin/login",(req,res)=>{
  const {email,password}=req.body||{};
  if (!ADMIN_PASSWORD) return res.status(503).json({error:"Set ADMIN_PASSWORD on the server first."});
  if(email===ADMIN_EMAIL && password===ADMIN_PASSWORD) return res.json({ok:true});
  res.status(401).json({error:"Invalid admin credentials"});
});

app.post("/api/register",(req,res)=>{
  const {tournamentId,team,captain,phone,players=[]}=req.body||{};
  const data=readData();
  const tournament=data.tournaments.find(t=>t.id===Number(tournamentId));
  if(!tournament) return res.status(400).json({error:"Tournament not found"});
  if(!team || !captain || !phone) return res.status(400).json({error:"Team, captain and phone are required"});
  const registration={id:Date.now(),tournamentId:tournament.id,tournament:tournament.name,game:tournament.game,team,captain,phone,players,createdAt:new Date().toISOString(),paymentStatus:tournament.fee? "PENDING":"FREE"};
  data.registrations.push(registration); writeData(data);
  res.json({ok:true,registration});
});

app.post("/api/admin/tournament",(req,res)=>{
  const {email,password,name,game,fee,prize}=req.body||{};
  if(email!==ADMIN_EMAIL || password!==ADMIN_PASSWORD) return res.status(401).json({error:"Unauthorized"});
  if(!name) return res.status(400).json({error:"Tournament name required"});
  const data=readData();
  const id=(data.tournaments.at(-1)?.id||0)+1;
  const t={id,name,game:game||"BGMI",fee:Number(fee)||0,prize:Number(prize)||0};
  data.tournaments.push(t); writeData(data); res.json({ok:true,tournament:t});
});

app.get("/{*splat}",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`YE TERA GAME running on http://localhost:${PORT}`));
