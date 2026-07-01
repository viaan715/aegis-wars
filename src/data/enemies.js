export const ETYPES={
  btr:{name:'BTR-82A',cat:'apc',w:22,h:12,spd:2.8,trv:0.035,col:'#5a4028',drk:'#3a2818',af:[40,30],as:[20,15],ar:[10,8],crew:3,pts:120,role:'flanker',cd:1000,pm:0.4,ability:null,apsActive:false},
  bmp3:{name:'BMP-3',cat:'ifv',w:26,h:14,spd:2.6,trv:0.032,col:'#5a4830',drk:'#3a3020',af:[80,60],as:[40,30],ar:[20,15],crew:3,pts:200,role:'scout',cd:1300,pm:0.55,ability:'rapidFire',abilityCd:0,apsActive:false},
  bradley:{name:'Bradley',cat:'ifv',w:28,h:15,spd:2.3,trv:0.028,col:'#5a5840',drk:'#3a3828',af:[100,75],as:[55,40],ar:[25,18],crew:3,pts:230,role:'scout',cd:1200,pm:0.6,ability:'tow',abilityCd:480,maxAbilityCd:480,apsActive:false},
  t72:{name:'T-72B3',cat:'tank',w:32,h:17,spd:1.6,trv:0.020,col:'#6a5030',drk:'#4a3820',af:[480,400],as:[260,200],ar:[90,60],crew:3,pts:400,role:'assault',cd:2400,pm:0.95,ability:null,apsActive:false},
  t90m:{name:'T-90M',cat:'tank',w:34,h:18,spd:1.7,trv:0.022,col:'#5a4828',drk:'#3a3018',af:[540,440],as:[290,230],ar:[100,70],crew:3,pts:500,role:'assault',cd:2200,pm:1.0,ability:'aps',abilityCd:400,maxAbilityCd:400,apsActive:true},
  leopard:{name:'Leopard 2A7',cat:'tank',w:36,h:19,spd:1.9,trv:0.024,col:'#5a5a48',drk:'#3a3a30',af:[560,470],as:[300,250],ar:[115,80],crew:3,pts:560,role:'sniper',cd:2600,pm:1.05,ability:null,apsActive:false},
  challenger:{name:'Challenger 2',cat:'tank',w:38,h:20,spd:1.5,trv:0.018,col:'#4a5040',drk:'#2e3228',af:[620,500],as:[320,260],ar:[130,85],crew:4,pts:600,role:'fortress',cd:2800,pm:1.1,ability:'smokeBarrage',abilityCd:500,maxAbilityCd:500,apsActive:false},
  abrams:{name:'M1A2',cat:'tank',w:36,h:19,spd:2.0,trv:0.025,col:'#606050',drk:'#404038',af:[580,480],as:[310,255],ar:[120,82],crew:4,pts:550,role:'assault',cd:2100,pm:1.02,ability:null,apsActive:false},
  hind:{name:'Mi-24 Hind',cat:'helo',w:30,h:12,spd:2.2,trv:0.035,col:'#486040',drk:'#2a3828',af:[80,60],as:[50,40],ar:[30,20],crew:2,pts:350,role:'gunship',cd:1800,pm:0.9,ability:'rocketPod',abilityCd:240,maxAbilityCd:240,apsActive:false},
  apache:{name:'AH-64 Apache',cat:'helo',w:26,h:10,spd:2.5,trv:0.04,col:'#485840',drk:'#283428',af:[60,50],as:[40,30],ar:[20,15],crew:2,pts:420,role:'hunter',cd:2000,pm:0.85,ability:'hellfire',abilityCd:380,maxAbilityCd:380,apsActive:false},
  drone:{name:'Kamikaze Drone',cat:'drone',w:12,h:8,spd:3.2,trv:0.06,col:'#5a5a58',drk:'#2a2a28',af:[20,15],as:[15,10],ar:[10,8],crew:1,pts:150,role:'kamikaze',cd:99999,pm:0,ability:'detonate',abilityCd:0,apsActive:false},
  infantry:{name:'AT Squad',cat:'infantry',w:8,h:8,spd:0.9,trv:0.05,col:'#486038',drk:'#283820',af:[10,8],as:[8,6],ar:[6,4],crew:3,pts:80,role:'ambush',cd:2500,pm:1.2,ability:null,apsActive:false},
  atgm:{name:'ATGM Team',cat:'infantry',w:10,h:8,spd:0.7,trv:0.04,col:'#405030',drk:'#202818',af:[12,10],as:[10,8],ar:[8,6],crew:2,pts:100,role:'sniper',cd:3500,pm:1.5,ability:'guidedMissile',abilityCd:0,apsActive:false},
  heavyTank:{name:'NEMESIS',cat:'tank',w:44,h:23,spd:0.9,trv:0.012,col:'#504838',drk:'#302e20',af:[860,700],as:[520,400],ar:[220,160],crew:4,pts:1400,role:'boss',cd:2800,pm:1.4,ability:'artyCall',abilityCd:600,maxAbilityCd:600,apsActive:false},
  // Extra tank enemies
  panther_e:{name:'Panther',cat:'tank',w:36,h:18,spd:1.6,trv:0.019,col:'#7a7050',drk:'#4a4030',af:[560,460],as:[220,160],ar:[90,60],crew:5,pts:480,role:'sniper',cd:2400,pm:1.05,ability:null,apsActive:false},
  tiger1_e:{name:'Tiger I',cat:'tank',w:38,h:20,spd:1.2,trv:0.016,col:'#7a7058',drk:'#4a4038',af:[500,420],as:[280,230],ar:[100,80],crew:5,pts:550,role:'fortress',cd:2600,pm:1.1,ability:null,apsActive:false},
  tiger2_e:{name:'Tiger II',cat:'tank',w:42,h:22,spd:1.0,trv:0.013,col:'#6a6848',drk:'#3a3828',af:[620,540],as:[340,280],ar:[140,100],crew:5,pts:700,role:'boss',cd:2800,pm:1.25,ability:'smokeBarrage',abilityCd:500,maxAbilityCd:500,apsActive:false},
  k2:{name:'K2 Black Panther',cat:'tank',w:35,h:18,spd:2.1,trv:0.027,col:'#5a6040',drk:'#383c28',af:[545,455],as:[288,238],ar:[112,79],crew:3,pts:570,role:'assault',cd:2100,pm:1.04,ability:null,apsActive:false},
};

export const WCOMPS=[
  [{t:'btr',n:3},{t:'bmp3',n:1}],
  [{t:'bmp3',n:2},{t:'t72',n:1},{t:'infantry',n:2}],
  [{t:'t72',n:2},{t:'bradley',n:1},{t:'hind',n:1}],
  [{t:'t90m',n:2},{t:'leopard',n:1},{t:'drone',n:2},{t:'atgm',n:2}],
  [{t:'challenger',n:1},{t:'abrams',n:1},{t:'apache',n:1},{t:'infantry',n:3}],
  [{t:'heavyTank',n:1},{t:'t90m',n:2},{t:'tiger1_e',n:1},{t:'hind',n:1},{t:'drone',n:3}],
  [{t:'heavyTank',n:2},{t:'abrams',n:2},{t:'apache',n:2},{t:'tiger2_e',n:1},{t:'atgm',n:3}],
];
