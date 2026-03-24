import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════
   PRELEVIA v5 — Plateforme complète
   Nouveautés :
   ✦ Upload bulletin dès la prise de RDV (app patient)
   ✦ OCR automatique des examens sur le bulletin
   ✦ Sélection manuelle si OCR insuffisant
   ✦ Agent voit les examens AVANT la visite
   ✦ Agent peut saisir/corriger si patient n'a pas uploadé
   ✦ Paiement immédiatement après prélèvement (sur place)
   ✦ Upload carte assurance + pièce d'identité dès le RDV
═══════════════════════════════════════════════════════ */

const C = {
  primary:"#0A6E5C", primaryLight:"#12937A", primaryDark:"#064D40",
  accent:"#F4A726", accentLight:"#FFC94D",
  bg:"#F5F7F6", text:"#1A2B26", textLight:"#5C7A74",
  border:"#D4E5E1", danger:"#E05C5C", success:"#2CB67D",
  info:"#3B82F6", purple:"#7C3AED", orange:"#F97316",
  dark:"#0D1117", dark2:"#161B22",
};

// Liste complète d'examens courants pour sélection manuelle
const EXAMENS_CATALOGUE = [
  "NFS","Glycémie à jeun","Glycémie post-prandiale","HbA1c",
  "Bilan lipidique","Cholestérol total","LDL","HDL","Triglycérides",
  "Créatinine","Urée","Acide urique","Bilan rénal complet",
  "ALAT / ASAT","Bilirubine","Bilan hépatique complet",
  "TSH","T4 libre","T3 libre","Bilan thyroïdien",
  "CRP","VS","Fibrinogène",
  "TP / TCA","Groupe sanguin / Rhésus",
  "ECBU","Hémoculture",
  "Microalbuminurie","Protéinurie 24h",
  "Fer sérique","Ferritine","Transferrine",
  "PSA","Beta HCG",
  "Ionogramme sanguin","Calcémie","Phosphorémie",
];

// Simule l'extraction OCR depuis un bulletin
function simulateOCR(filename) {
  const pools = [
    ["NFS","Glycémie à jeun","Bilan lipidique"],
    ["TSH","T4 libre","CRP"],
    ["HbA1c","Créatinine","Microalbuminurie"],
    ["ALAT / ASAT","Bilirubine","TP / TCA"],
    ["NFS","Créatinine","Urée","Ferritine"],
  ];
  return pools[Math.floor(Math.random() * pools.length)];
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@500;600&family=DM+Sans:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Plus Jakarta Sans',sans-serif;background:#e2ebe8;min-height:100vh;}

.platform-nav{position:fixed;top:0;left:0;right:0;z-index:500;background:rgba(6,77,64,0.97);backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:56px;box-shadow:0 2px 20px rgba(0,0,0,0.2);}
.pnav-logo{font-family:'Lora',serif;font-size:20px;font-weight:600;color:#fff;}
.pnav-logo span{color:#F4A726;}
.pnav-tabs{display:flex;gap:4px;}
.pnav-tab{padding:7px 18px;border-radius:8px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:600;transition:all 0.2s;color:rgba(255,255,255,0.55);background:transparent;}
.pnav-tab:hover{color:#fff;background:rgba(255,255,255,0.08);}
.pnav-tab.active{color:#064D40;background:#F4A726;}
.pnav-badge{background:rgba(244,167,38,0.2);border:1px solid rgba(244,167,38,0.35);color:#FFC94D;font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600;}

/* ── WEB ── */
.web-wrapper{padding-top:56px;min-height:100vh;display:flex;}
.sidebar{width:255px;background:#064D40;display:flex;flex-direction:column;position:fixed;top:56px;left:0;bottom:0;z-index:100;box-shadow:4px 0 20px rgba(0,0,0,0.12);}
.sidebar-logo{padding:20px 20px 14px;border-bottom:1px solid rgba(255,255,255,0.07);}
.logo-name{font-family:'Lora',serif;font-size:22px;font-weight:600;color:#fff;}
.logo-name span{color:#F4A726;}
.logo-sub{font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.5px;margin-top:2px;}
.coverage-badge{margin:10px 14px;background:rgba(244,167,38,0.12);border:1px solid rgba(244,167,38,0.25);border-radius:8px;padding:8px 12px;font-size:11px;color:#FFC94D;line-height:1.5;}
.coverage-badge strong{display:block;font-size:9px;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;opacity:0.65;}
.nav{flex:1;padding:6px 10px;overflow-y:auto;}
.nav-sec{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.25);padding:14px 10px 5px;}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:9px;cursor:pointer;color:rgba(255,255,255,0.55);font-size:13px;font-weight:500;transition:all 0.18s;margin-bottom:2px;}
.nav-item:hover{background:rgba(255,255,255,0.07);color:#fff;}
.nav-item.active{background:#0A6E5C;color:#fff;}
.nav-icon{font-size:17px;width:20px;text-align:center;}
.nav-badge{margin-left:auto;background:#F4A726;color:#064D40;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;}
.sidebar-footer{padding:12px;border-top:1px solid rgba(255,255,255,0.07);}
.user-card{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:rgba(255,255,255,0.05);}
.user-avatar{width:34px;height:34px;border-radius:50%;background:#0A6E5C;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;}
.user-name{font-size:12px;font-weight:600;color:#fff;}
.user-role{font-size:10px;color:rgba(255,255,255,0.35);}
.main{margin-left:255px;flex:1;display:flex;flex-direction:column;}
.topbar{background:#fff;border-bottom:1px solid #D4E5E1;padding:0 28px;height:58px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:56px;z-index:50;}
.topbar-title{font-size:18px;font-weight:700;}
.topbar-sub{color:#5C7A74;font-weight:400;font-size:14px;margin-left:8px;}
.content{padding:24px 28px;flex:1;}

.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all 0.18s;font-family:'Plus Jakarta Sans',sans-serif;}
.btn:disabled{opacity:0.4;cursor:not-allowed;}
.btn-primary{background:#0A6E5C;color:#fff;box-shadow:0 3px 10px rgba(10,110,92,0.2);}
.btn-primary:hover:not(:disabled){background:#12937A;transform:translateY(-1px);}
.btn-outline{background:transparent;color:#0A6E5C;border:1.5px solid #D4E5E1;}
.btn-outline:hover:not(:disabled){border-color:#0A6E5C;background:rgba(10,110,92,0.04);}
.btn-accent{background:#F4A726;color:#064D40;}
.btn-accent:hover:not(:disabled){background:#FFC94D;}
.btn-danger{background:#E05C5C;color:#fff;}
.btn-success{background:#2CB67D;color:#fff;}
.btn-info{background:#3B82F6;color:#fff;}
.btn-orange{background:#F97316;color:#fff;}
.btn-sm{padding:5px 11px;font-size:12px;}
.btn-xs{padding:3px 8px;font-size:11px;}

.section{background:#fff;border-radius:13px;border:1px solid #D4E5E1;overflow:hidden;margin-bottom:18px;}
.section-header{padding:16px 22px;border-bottom:1px solid #D4E5E1;display:flex;align-items:center;justify-content:space-between;}
.section-title{font-size:14px;font-weight:700;}
.section-sub{font-size:12px;color:#5C7A74;margin-top:2px;}
.table{width:100%;border-collapse:collapse;}
.table th{text-align:left;padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.7px;color:#5C7A74;background:#F5F7F6;font-weight:600;}
.table td{padding:12px 14px;font-size:13px;border-top:1px solid #D4E5E1;vertical-align:middle;}
.table tr:hover td{background:rgba(10,110,92,0.02);}
.scrollable{overflow-x:auto;}

.badge{display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;}
.b-success{background:rgba(44,182,125,0.12);color:#2CB67D;}
.b-warning{background:rgba(244,167,38,0.15);color:#B07400;}
.b-info{background:rgba(59,130,246,0.12);color:#3B82F6;}
.b-danger{background:rgba(224,92,92,0.12);color:#E05C5C;}
.b-purple{background:rgba(124,58,237,0.12);color:#7C3AED;}
.b-neutral{background:rgba(92,122,116,0.1);color:#5C7A74;}
.b-orange{background:rgba(249,115,22,0.12);color:#F97316;}
.b-teal{background:rgba(10,110,92,0.1);color:#0A6E5C;}

.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px;}
.stat-card{background:#fff;border-radius:13px;padding:18px;border:1px solid #D4E5E1;position:relative;overflow:hidden;transition:transform 0.2s,box-shadow 0.2s;}
.stat-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.07);}
.stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:10px;}
.stat-value{font-size:24px;font-weight:800;line-height:1;}
.stat-label{font-size:11px;color:#5C7A74;margin-top:3px;font-weight:500;}
.stat-change{font-size:10px;margin-top:6px;font-weight:600;color:#5C7A74;}
.stat-deco{position:absolute;right:-8px;bottom:-8px;font-size:50px;opacity:0.06;}

.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px;}
.modal{background:#fff;border-radius:16px;width:100%;max-width:640px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);}
.modal-lg{max-width:800px;}
.modal-header{padding:20px 24px 16px;border-bottom:1px solid #D4E5E1;display:flex;align-items:flex-start;justify-content:space-between;}
.modal-title{font-size:16px;font-weight:700;}
.modal-sub{font-size:12px;color:#5C7A74;margin-top:2px;}
.modal-close{cursor:pointer;background:#F5F7F6;border:none;border-radius:7px;width:30px;height:30px;font-size:15px;display:flex;align-items:center;justify-content:center;color:#5C7A74;}
.modal-close:hover{background:#D4E5E1;}
.modal-body{padding:20px 24px;}
.modal-footer{padding:14px 24px;border-top:1px solid #D4E5E1;display:flex;justify-content:flex-end;gap:8px;}

.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.form-group{display:flex;flex-direction:column;gap:5px;}
.form-group.span2{grid-column:span 2;}
.form-label{font-size:11px;font-weight:600;color:#5C7A74;text-transform:uppercase;letter-spacing:0.5px;}
.form-input,.form-select{padding:9px 12px;border:1.5px solid #D4E5E1;border-radius:8px;font-size:13px;color:#1A2B26;background:#F5F7F6;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all 0.18s;}
.form-input:focus,.form-select:focus{border-color:#0A6E5C;background:#fff;box-shadow:0 0 0 3px rgba(10,110,92,0.09);}
.form-divider{display:flex;align-items:center;gap:10px;color:#5C7A74;font-size:11px;margin:8px 0;grid-column:span 2;}
.form-divider::before,.form-divider::after{content:'';flex:1;height:1px;background:#D4E5E1;}

/* OCR & UPLOAD */
.upload-zone{border:2px dashed #D4E5E1;border-radius:11px;padding:16px;cursor:pointer;transition:all 0.2s;background:#F5F7F6;text-align:center;}
.upload-zone:hover{border-color:#0A6E5C;background:rgba(10,110,92,0.03);}
.upload-zone.has-file{border-color:#2CB67D;background:rgba(44,182,125,0.04);}
.ocr-scanning{background:linear-gradient(135deg,rgba(59,130,246,0.08),rgba(10,110,92,0.08));border:1px solid rgba(59,130,246,0.2);border-radius:11px;padding:14px;display:flex;align-items:center;gap:12px;}
.ocr-spinner{width:28px;height:28px;border:3px solid rgba(10,110,92,0.15);border-top-color:#0A6E5C;border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0;}
@keyframes spin{to{transform:rotate(360deg);}}
.ocr-result-box{background:rgba(44,182,125,0.06);border:1px solid rgba(44,182,125,0.2);border-radius:11px;padding:14px;}
.ocr-result-title{font-size:12px;font-weight:700;color:#065f46;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
.exam-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;margin:3px;}
.exam-chip.selected{background:#0A6E5C;color:#fff;}
.exam-chip.ocr-detected{background:rgba(44,182,125,0.12);color:#065f46;border:1.5px solid rgba(44,182,125,0.3);}
.exam-chip.ocr-detected.selected{background:#2CB67D;color:#fff;border-color:#2CB67D;}
.exam-chip.manual{background:#F5F7F6;color:#5C7A74;border:1.5px solid #D4E5E1;}
.exam-chip.manual.selected{background:#0A6E5C;color:#fff;border-color:#0A6E5C;}
.doc-file-row{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:9px;background:#F5F7F6;border:1px solid #D4E5E1;margin-bottom:6px;}
.doc-file-row.uploaded{background:rgba(44,182,125,0.06);border-color:rgba(44,182,125,0.25);}
.doc-file-icon{font-size:20px;flex-shrink:0;}
.doc-file-name{font-size:12px;font-weight:600;flex:1;}
.doc-file-status{font-size:11px;}

/* PAIEMENT */
.payment-methods{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;}
.pm-option{border:2px solid #D4E5E1;border-radius:11px;padding:12px;cursor:pointer;transition:all 0.18s;display:flex;align-items:center;gap:9px;}
.pm-option.selected{border-color:#0A6E5C;background:rgba(10,110,92,0.04);}
.pm-icon{font-size:22px;}
.pm-name{font-size:12px;font-weight:600;}
.pm-detail{font-size:10px;color:#5C7A74;}

.steps-bar{display:flex;gap:0;margin-bottom:20px;}
.step-item{flex:1;display:flex;flex-direction:column;align-items:center;position:relative;}
.step-item:not(:last-child)::after{content:'';position:absolute;top:17px;left:50%;width:100%;height:2px;background:#D4E5E1;z-index:0;}
.step-item.done:not(:last-child)::after{background:#2CB67D;}
.step-dot{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;z-index:1;border:2px solid #D4E5E1;background:#fff;color:#5C7A74;}
.step-item.done .step-dot{background:#2CB67D;border-color:#2CB67D;color:#fff;}
.step-item.active .step-dot{background:#0A6E5C;border-color:#0A6E5C;color:#fff;box-shadow:0 0 0 4px rgba(10,110,92,0.12);}
.step-label{font-size:10px;font-weight:600;margin-top:6px;text-align:center;color:#5C7A74;max-width:72px;line-height:1.3;}
.step-item.done .step-label,.step-item.active .step-label{color:#1A2B26;}

.exam-row{display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:9px;border:1.5px solid #D4E5E1;margin-bottom:7px;}
.exam-row.covered{border-color:#2CB67D;background:rgba(44,182,125,0.04);}
.exam-row.not-covered{border-color:#E05C5C;background:rgba(224,92,92,0.04);}
.exam-row.pending{background:#F5F7F6;}

.summary-box{background:#F5F7F6;border-radius:11px;padding:16px;margin-top:10px;}
.summary-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:13px;}
.summary-row.total{border-top:1px solid #D4E5E1;margin-top:7px;padding-top:11px;font-size:15px;font-weight:800;}

.info-banner{padding:11px 14px;border-radius:9px;font-size:12px;line-height:1.6;margin-bottom:10px;}
.info-blue{background:rgba(59,130,246,0.07);border:1px solid rgba(59,130,246,0.18);color:#1e40af;}
.info-green{background:rgba(44,182,125,0.07);border:1px solid rgba(44,182,125,0.18);color:#065f46;}
.info-orange{background:rgba(249,115,22,0.07);border:1px solid rgba(249,115,22,0.22);color:#9a3412;}
.info-yellow{background:rgba(234,179,8,0.07);border:1px solid rgba(234,179,8,0.25);color:#92400e;}
.info-teal{background:rgba(10,110,92,0.07);border:1px solid rgba(10,110,92,0.2);color:#064D40;}

.commune-tag{display:inline-flex;align-items:center;gap:3px;background:rgba(10,110,92,0.08);color:#0A6E5C;font-size:11px;font-weight:600;padding:2px 7px;border-radius:5px;}
.search-bar{display:flex;align-items:center;gap:7px;padding:8px 13px;background:#F5F7F6;border:1.5px solid #D4E5E1;border-radius:9px;width:230px;}
.search-bar input{border:none;background:transparent;font-size:13px;color:#1A2B26;outline:none;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
.dash-grid{display:grid;grid-template-columns:2fr 1fr;gap:18px;}
.quick-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px;}
.qa-card{background:#fff;border:1px solid #D4E5E1;border-radius:13px;padding:16px;cursor:pointer;transition:all 0.18s;display:flex;align-items:center;gap:12px;}
.qa-card:hover{border-color:#0A6E5C;box-shadow:0 4px 14px rgba(10,110,92,0.09);transform:translateY(-1px);}
.qa-icon{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:11px;flex-shrink:0;font-size:22px;}
.qa-label{font-size:13px;font-weight:700;}
.qa-sub{font-size:11px;color:#5C7A74;margin-top:1px;}
.toast{position:fixed;bottom:20px;right:20px;background:#1A2B26;color:#fff;padding:12px 18px;border-radius:11px;font-size:13px;font-weight:500;box-shadow:0 6px 20px rgba(0,0,0,0.2);z-index:999;display:flex;align-items:center;gap:9px;animation:slideUp 0.3s ease;}
@keyframes slideUp{from{transform:translateY(18px);opacity:0;}to{transform:translateY(0);opacity:1;}}

/* ── MOBILE ── */
.mobile-wrapper{padding-top:56px;min-height:100vh;display:flex;flex-direction:column;align-items:center;background:#d6e4e0;}
.mobile-scene{display:flex;gap:36px;align-items:flex-start;padding:28px 24px 40px;flex-wrap:wrap;justify-content:center;}
.phone-frame{width:360px;border-radius:44px;overflow:hidden;box-shadow:0 28px 70px rgba(0,0,0,0.2),0 0 0 7px #1a1a1a,0 0 0 9px #2e2e2e;position:relative;background:#fff;display:flex;flex-direction:column;}
.phone-notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:110px;height:28px;background:#1a1a1a;border-radius:0 0 18px 18px;z-index:50;}
.phone-label{text-align:center;font-size:13px;font-weight:700;color:#3a5a54;margin-top:12px;}
.phone-sub{text-align:center;font-size:11px;color:#6a8f88;margin-top:2px;}

/* APP PATIENT */
.p-app{background:#f4f9f7;flex:1;display:flex;flex-direction:column;min-height:820px;overflow:hidden;}
.p-header{background:linear-gradient(140deg,#0A6E5C 0%,#12937A 100%);padding:44px 20px 0;position:relative;overflow:hidden;}
.p-header::before{content:'';position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.06);}
.p-greeting{font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:0.5px;}
.p-name{font-family:'Syne',sans-serif;font-size:20px;color:#fff;margin-top:2px;font-weight:700;}
.p-rdv{margin-top:12px;background:rgba(255,255,255,0.12);border-radius:12px;padding:10px 13px;display:flex;align-items:center;gap:10px;}
.p-rdv-val{font-size:13px;color:#fff;font-weight:600;}
.p-rdv-sub{font-size:11px;color:rgba(255,255,255,0.55);}
.p-tabs{display:flex;background:rgba(0,0,0,0.12);}
.p-tab{flex:1;text-align:center;padding:10px 0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.45);cursor:pointer;border-bottom:2px solid transparent;transition:all 0.18s;font-family:'DM Sans',sans-serif;}
.p-tab.active{color:#fff;border-bottom-color:rgba(255,255,255,0.75);}
.p-content{flex:1;padding:14px;overflow-y:auto;}

/* OCR mobile */
.m-upload-zone{border:2px dashed rgba(10,110,92,0.3);border-radius:14px;padding:18px;text-align:center;cursor:pointer;background:rgba(10,110,92,0.04);transition:all 0.2s;margin-bottom:10px;}
.m-upload-zone:hover{border-color:#0A6E5C;background:rgba(10,110,92,0.07);}
.m-upload-zone.has-file{border-color:#2CB67D;background:rgba(44,182,125,0.06);}
.m-ocr-scanning{background:linear-gradient(135deg,#EFF6FF,#E8F5F2);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:12px;display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.m-ocr-spinner{width:24px;height:24px;border:2.5px solid rgba(10,110,92,0.2);border-top-color:#0A6E5C;border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0;}
.m-exam-grid{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.m-exam-chip{padding:5px 11px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;transition:all 0.15s;border:1.5px solid;}
.m-exam-chip.ocr{background:rgba(44,182,125,0.1);color:#065f46;border-color:rgba(44,182,125,0.35);}
.m-exam-chip.ocr.sel{background:#2CB67D;color:#fff;border-color:#2CB67D;}
.m-exam-chip.cat{background:#F5F7F6;color:#5C7A74;border-color:#D4E5E1;}
.m-exam-chip.cat.sel{background:#0A6E5C;color:#fff;border-color:#0A6E5C;}
.m-doc-row{display:flex;align-items:center;gap:8px;padding:8px 11px;border-radius:10px;margin-bottom:7px;border:1.5px solid;}
.m-doc-row.pending{background:#F5F7F6;border-color:#D4E5E1;}
.m-doc-row.done{background:rgba(44,182,125,0.06);border-color:rgba(44,182,125,0.25);}

/* Tracker */
.tracker-card{background:#fff;border-radius:16px;padding:14px;box-shadow:0 3px 14px rgba(0,0,0,0.06);margin-bottom:12px;}
.tc-title{font-size:12px;font-weight:700;color:#1A2B26;margin-bottom:11px;display:flex;align-items:center;gap:6px;}
.tc-map{height:130px;background:linear-gradient(135deg,#e4f4f0,#cce9e3);border-radius:12px;position:relative;overflow:hidden;margin-bottom:10px;}
.map-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(10,110,92,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(10,110,92,0.06) 1px,transparent 1px);background-size:22px 22px;}
.road-h{position:absolute;left:0;right:0;height:4px;background:rgba(255,255,255,0.75);}
.road-v{position:absolute;top:0;bottom:0;width:4px;background:rgba(255,255,255,0.75);}
.pin-agent{position:absolute;width:32px;height:32px;background:#0A6E5C;border-radius:50%;border:3px solid #fff;box-shadow:0 3px 10px rgba(10,110,92,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;animation:agentRide 5s ease-in-out infinite;}
@keyframes agentRide{0%{transform:translate(50px,60px);}33%{transform:translate(96px,44px);}66%{transform:translate(140px,60px);}100%{transform:translate(50px,60px);}}
.pin-home{position:absolute;right:36px;bottom:22px;width:29px;height:29px;background:#F4A726;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 3px 10px rgba(244,167,38,0.4);}
.pin-pulse{position:absolute;right:36px;bottom:22px;width:50px;height:50px;border-radius:50%;background:rgba(244,167,38,0.18);animation:mpulse 2s ease-out infinite;transform:translate(-11px,-11px);}
@keyframes mpulse{0%{transform:translate(-11px,-11px) scale(0.8);opacity:1;}100%{transform:translate(-11px,-11px) scale(1.9);opacity:0;}}
.eta-row{display:flex;align-items:center;justify-content:space-between;}
.eta-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#0A6E5C,#12937A);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;}
.eta-name{font-size:13px;font-weight:700;}
.eta-sub{font-size:10px;color:#5C7A74;}
.eta-min{font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#0A6E5C;line-height:1;text-align:right;}
.eta-lbl{font-size:10px;color:#5C7A74;text-align:right;}

/* Timeline */
.tl{display:flex;flex-direction:column;}
.tl-item{display:flex;gap:12px;position:relative;}
.tl-line{position:absolute;left:13px;top:27px;bottom:-10px;width:2px;background:#D4E5E1;z-index:0;}
.tl-item.done .tl-line{background:#0A6E5C;}
.tl-dot{width:27px;height:27px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;z-index:1;border:2px solid #D4E5E1;background:#fff;color:#9CB5B0;}
.tl-item.done .tl-dot{background:#0A6E5C;border-color:#0A6E5C;color:#fff;}
.tl-item.tl-active .tl-dot{background:#F4A726;border-color:#F4A726;color:#fff;animation:tdot 1.8s ease-in-out infinite;}
@keyframes tdot{0%,100%{box-shadow:0 0 0 0 rgba(244,167,38,0.35);}50%{box-shadow:0 0 0 7px rgba(244,167,38,0);}}
.tl-body{padding-bottom:16px;}
.tl-title{font-size:12px;font-weight:700;color:#1A2B26;}
.tl-item.tl-pending .tl-title{color:#9CB5B0;}
.tl-sub{font-size:11px;color:#5C7A74;}
.tl-time{font-size:10px;color:#0A6E5C;font-weight:600;margin-top:2px;}

/* Résultats */
.res-card{border-radius:15px;padding:14px;color:#fff;margin-bottom:11px;position:relative;overflow:hidden;}
.res-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;margin-bottom:9px;}
.res-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.1);font-size:12px;}
.res-row:last-child{border-bottom:none;}
.res-val{font-weight:700;}
.rv-ok{color:#7dffc8;} .rv-alert{color:#FFD580;}

/* Bottom nav patient */
.p-nav{display:flex;background:#fff;border-top:1px solid #E8F0EE;padding:7px 0 18px;}
.pn-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:5px 0;}
.pn-icon{font-size:19px;}
.pn-lbl{font-size:10px;color:#9CB5B0;font-weight:600;}
.pn-item.active .pn-lbl{color:#0A6E5C;}
.pn-dot{width:4px;height:4px;border-radius:50%;background:#0A6E5C;}

/* APP AGENT */
.a-app{background:#0D1117;flex:1;display:flex;flex-direction:column;min-height:820px;overflow:hidden;}
.a-header{background:#0D1117;padding:44px 18px 14px;border-bottom:1px solid rgba(255,255,255,0.05);}
.a-toprow{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px;}
.a-greeting{font-size:10px;color:#4B5563;letter-spacing:0.8px;text-transform:uppercase;}
.a-name{font-family:'Syne',sans-serif;font-size:19px;color:#F9FAFB;margin-top:1px;font-weight:700;}
.a-status-badge{display:flex;align-items:center;gap:5px;background:rgba(44,182,125,0.1);border:1px solid rgba(44,182,125,0.22);padding:4px 11px;border-radius:20px;}
.a-sdot{width:7px;height:7px;border-radius:50%;background:#2CB67D;animation:ablink 2s ease-in-out infinite;}
@keyframes ablink{0%,100%{opacity:1;}50%{opacity:0.25;}}
.a-stext{font-size:11px;color:#2CB67D;font-weight:600;}
.a-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;}
.a-stat{background:#161B22;border-radius:12px;padding:11px;border:1px solid rgba(255,255,255,0.04);}
.as-val{font-family:'Syne',sans-serif;font-size:19px;font-weight:700;}
.as-lbl{font-size:9px;color:#4B5563;margin-top:1px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;}
.a-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,0.05);padding:0 14px;background:#0D1117;}
.a-tab{flex:1;text-align:center;padding:9px 0;font-size:11px;font-weight:700;color:#4B5563;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.18s;font-family:'DM Sans',sans-serif;}
.a-tab.active{color:#0A6E5C;border-bottom-color:#0A6E5C;}
.a-content{flex:1;overflow-y:auto;padding:13px;}

.sec-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.sec-hd-title{font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:1px;}
.sec-hd-badge{font-size:10px;background:rgba(244,167,38,0.12);color:#F4A726;padding:2px 7px;border-radius:9px;font-weight:700;}

/* Mission card */
.mission-card{background:#161B22;border-radius:14px;padding:14px;margin-bottom:9px;border:1px solid rgba(255,255,255,0.04);transition:border-color 0.18s;position:relative;overflow:hidden;}
.mission-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:#2C3540;}
.mission-card.mc-active{border-color:#0A6E5C;}
.mission-card.mc-active::before{background:#0A6E5C;}
.mission-card.mc-urgent::before{background:#E05C5C;}
.mission-card.mc-done::before{background:#2CB67D;}
.mc-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;}
.mc-num{font-size:10px;color:#4B5563;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;}
.mc-patient{font-size:14px;font-weight:700;color:#F9FAFB;}
.mc-addr{font-size:11px;color:#4B5563;margin-top:2px;}
.mc-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px;}
.mc-tag{font-size:10px;font-weight:600;padding:2px 7px;border-radius:7px;background:rgba(255,255,255,0.04);color:#6B7280;border:1px solid rgba(255,255,255,0.05);}
.mc-tag.ocr-tag{background:rgba(44,182,125,0.1);color:#2CB67D;border-color:rgba(44,182,125,0.2);}
.mc-tag.manual-tag{background:rgba(244,167,38,0.08);color:#F4A726;border-color:rgba(244,167,38,0.15);}
.mc-tag.agent-tag{background:rgba(59,130,246,0.1);color:#60A5FA;border-color:rgba(59,130,246,0.2);}
.mc-foot{display:flex;align-items:center;justify-content:space-between;margin-top:9px;padding-top:9px;border-top:1px solid rgba(255,255,255,0.05);}
.mc-time{font-size:11px;color:#4B5563;}
.mc-btn{padding:5px 12px;border-radius:7px;border:none;cursor:pointer;font-size:11px;font-weight:700;font-family:'DM Sans',sans-serif;}
.mcb-start{background:#0A6E5C;color:#fff;}
.mcb-gps{background:rgba(59,130,246,0.12);color:#60A5FA;border:1px solid rgba(59,130,246,0.18);}
.mcb-pay{background:#F4A726;color:#064D40;}
.mcb-done{background:rgba(44,182,125,0.1);color:#2CB67D;cursor:default;}
.mc-pri{font-size:10px;padding:2px 7px;border-radius:8px;font-weight:700;}
.mcp-urgent{background:rgba(224,92,92,0.13);color:#E05C5C;}
.mcp-normal{background:rgba(59,130,246,0.1);color:#60A5FA;}
.mcp-done{background:rgba(44,182,125,0.1);color:#2CB67D;}

/* OCR badge agent */
.ocr-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(44,182,125,0.1);border:1px solid rgba(44,182,125,0.2);color:#2CB67D;font-size:10px;font-weight:700;padding:3px 8px;border-radius:8px;margin-bottom:8px;}
.missing-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(244,167,38,0.1);border:1px solid rgba(244,167,38,0.2);color:#F4A726;font-size:10px;font-weight:700;padding:3px 8px;border-radius:8px;margin-bottom:8px;}

/* Agent exam saisie */
.a-exam-grid{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;}
.a-exam-chip{padding:4px 9px;border-radius:14px;font-size:10px;font-weight:700;cursor:pointer;border:1px solid;}
.a-exam-chip.unsel{background:rgba(255,255,255,0.04);color:#6B7280;border-color:rgba(255,255,255,0.08);}
.a-exam-chip.sel{background:#0A6E5C;color:#fff;border-color:#0A6E5C;}

/* Paiement agent modal dark */
.a-pay-modal{background:#161B22;border-radius:16px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.4);overflow:hidden;}
.a-pay-header{padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;}
.a-pay-pm{border:2px solid rgba(255,255,255,0.08);border-radius:11px;padding:11px;cursor:pointer;transition:all 0.18s;display:flex;align-items:center;gap:9px;background:#0D1117;margin-bottom:8px;}
.a-pay-pm.selected{border-color:#0A6E5C;background:rgba(10,110,92,0.1);}

/* Revenus */
.rev-card{background:linear-gradient(135deg,#161B22,#1F2937);border-radius:17px;padding:16px;border:1px solid rgba(255,255,255,0.05);margin-bottom:12px;position:relative;overflow:hidden;}
.rev-card::after{content:'💰';position:absolute;right:10px;bottom:-6px;font-size:52px;opacity:0.07;}
.rev-label{font-size:10px;color:#4B5563;text-transform:uppercase;letter-spacing:1px;font-weight:600;}
.rev-amount{font-family:'Syne',sans-serif;font-size:30px;font-weight:800;color:#F9FAFB;margin:3px 0;}
.rev-amount span{color:#2CB67D;}
.rev-sub{font-size:11px;color:#4B5563;}
.rev-bar-wrap{margin-top:12px;}
.rev-bar-head{display:flex;justify-content:space-between;font-size:10px;color:#4B5563;margin-bottom:4px;}
.rev-bar-track{height:5px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden;}
.rev-bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#0A6E5C,#12937A);}
.rev-row{background:#161B22;border-radius:12px;padding:12px;margin-bottom:7px;border:1px solid rgba(255,255,255,0.04);display:flex;justify-content:space-between;align-items:center;}
.rr-name{font-size:12px;font-weight:700;color:#F9FAFB;}
.rr-sub{font-size:10px;color:#4B5563;margin-top:2px;}
.rr-amount{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#2CB67D;}

/* Matériel */
.mat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
.mat-card{background:#161B22;border-radius:13px;padding:13px;border:1px solid rgba(255,255,255,0.04);}
.mat-icon{font-size:20px;margin-bottom:7px;}
.mat-name{font-size:10px;color:#4B5563;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;}
.mat-qty{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;margin:2px 0;}
.mq-ok{color:#2CB67D;}.mq-low{color:#F4A726;}.mq-crit{color:#E05C5C;}
.mat-unit{font-size:10px;color:#374151;}
.mat-bar-t{height:4px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden;margin-top:5px;}
.mat-bar-f{height:100%;border-radius:2px;}
.mat-alert{font-size:10px;color:#E05C5C;margin-top:3px;font-weight:600;}
.a-alert-card{background:rgba(224,92,92,0.07);border:1px solid rgba(224,92,92,0.18);border-radius:11px;padding:11px 12px;margin-bottom:9px;display:flex;align-items:center;gap:9px;}
.aac-icon{font-size:18px;flex-shrink:0;}
.aac-text{font-size:12px;color:#E05C5C;font-weight:600;}
.aac-sub{font-size:10px;color:rgba(224,92,92,0.65);}

.a-nav{display:flex;background:#0D1117;border-top:1px solid rgba(255,255,255,0.05);padding:7px 0 18px;}
.an-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:5px 0;}
.an-icon{font-size:19px;}
.an-lbl{font-size:10px;color:#4B5563;font-weight:600;}
.an-item.active .an-lbl{color:#0A6E5C;}
.an-dot{width:4px;height:4px;border-radius:50%;background:#0A6E5C;}
.notif-wrap{position:relative;display:inline-block;}
.notif-badge{position:absolute;top:-3px;right:-3px;width:15px;height:15px;border-radius:50%;background:#E05C5C;color:#fff;font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #0D1117;}
.p-content::-webkit-scrollbar,.a-content::-webkit-scrollbar{width:0;}
`;

// ── DONNÉES ──────────────────────────────────────────────
const INIT_PATIENTS = [
  {
    id:"PRV-001",nom:"Koné Aminata",dob:"1990-03-15",tel:"+225 07 45 12 34",commune:"Yopougon",
    assurance:"MUGEFCI",num_carte:"MUG-2024-0891",
    statut:"Payé",statut_assurance:"valide_partiel",
    examens:[{nom:"NFS",tarif:4500,couvert:true},{nom:"Glycémie à jeun",tarif:3000,couvert:true},{nom:"Bilan lipidique",tarif:7500,couvert:false}],
    docs:{bulletin:"bulletin_kone.jpg",assurance_card:"carte_mugefci.jpg",cni:"cni_kone.jpg"},
    ocr_source:"auto", // auto | manual | agent
    prescription:"PRX-2024-001",paid:true,
  },
  {
    id:"PRV-002",nom:"Diallo Ibrahim",dob:"1975-08-22",tel:"+225 01 23 45 67",commune:"Cocody",
    assurance:null,num_carte:null,statut:"Payé",statut_assurance:null,
    examens:[{nom:"Bilan rénal",tarif:12000,couvert:null},{nom:"ECBU",tarif:5500,couvert:null}],
    docs:{bulletin:"bulletin_diallo.jpg",assurance_card:null,cni:"cni_diallo.jpg"},
    ocr_source:"manual",prescription:"PRX-2024-002",paid:true,
  },
  {
    id:"PRV-003",nom:"Yao Bernadette",dob:"2001-12-01",tel:"+225 05 67 89 01",commune:"Yopougon",
    assurance:"CNPS",num_carte:"CNPS-88-45612",statut:"Payé",statut_assurance:"valide_total",
    examens:[{nom:"TSH",tarif:9000,couvert:true},{nom:"T4 libre",tarif:9000,couvert:true}],
    docs:{bulletin:"bulletin_yao.jpg",assurance_card:"carte_cnps.jpg",cni:"cni_yao.jpg"},
    ocr_source:"auto",prescription:"PRX-2024-003",paid:true,
  },
  {
    id:"PRV-004",nom:"Traoré Moussa",dob:"1988-06-10",tel:"+225 07 11 22 33",commune:"Yopougon",
    assurance:null,num_carte:null,statut:"Prélèvement effectué",statut_assurance:null,
    examens:[{nom:"Groupe sanguin",tarif:3000,couvert:null},{nom:"TP/TCA",tarif:5500,couvert:null}],
    docs:{bulletin:null,assurance_card:null,cni:null}, // pas uploadé — agent a saisi
    ocr_source:"agent",prescription:"PRX-2024-004",paid:false,
  },
  {
    id:"PRV-005",nom:"Bamba Fatoumata",dob:"1963-04-28",tel:"+225 01 99 88 77",commune:"Attécoubé",
    assurance:"MUGEFCI",num_carte:"MUG-2023-3341",statut:"Docs collectés",statut_assurance:"docs_collectes",
    examens:[{nom:"HbA1c",tarif:12000,couvert:null},{nom:"Créatinine",tarif:4500,couvert:null},{nom:"Microalbuminurie",tarif:8000,couvert:null}],
    docs:{bulletin:"bulletin_bamba.jpg",assurance_card:"carte_mugefci2.jpg",cni:"cni_bamba.jpg"},
    ocr_source:"auto",prescription:"PRX-2024-005",paid:false,
  },
  {
    id:"PRV-006",nom:"Coulibaly Jean-Pierre",dob:"1980-02-14",tel:"+225 07 88 77 66",commune:"Yopougon",
    assurance:"Sanlam CI",num_carte:"SAN-2024-1122",statut:"En attente validation",statut_assurance:"en_validation",
    examens:[{nom:"NFS complète",tarif:5000,couvert:null},{nom:"CRP",tarif:4000,couvert:null},{nom:"VS",tarif:2500,couvert:null}],
    docs:{bulletin:"bulletin_coulibaly.jpg",assurance_card:"carte_sanlam.jpg",cni:"cni_coulibaly.jpg"},
    ocr_source:"auto",prescription:"PRX-2024-006",paid:false,
  },
];

const INIT_MISSIONS = [
  {id:"M-001",patient:"Koné Aminata",patientId:"PRV-001",addr:"Rue des Jardins, Yopougon",
   examens:["NFS","Glycémie à jeun","Bilan lipidique"],ocr_source:"auto",
   heure:"09:15",priority:"urgent",status:"done",assurance:"MUGEFCI",assur_status:"valide_partiel",paid:true},
  {id:"M-002",patient:"Bamba Fatoumata",patientId:"PRV-005",addr:"Cité SIM Bloc 4, Yopougon",
   examens:["HbA1c","Créatinine","Microalbuminurie"],ocr_source:"auto",
   heure:"10:30",priority:"normal",status:"active",assurance:"MUGEFCI",assur_status:"docs_collectes",paid:false},
  {id:"M-003",patient:"Traoré Moussa",patientId:"PRV-004",addr:"Ancien Banco, Yopougon",
   examens:["Groupe sanguin","TP/TCA"],ocr_source:"agent", // agent a saisi car pas uploadé
   heure:"11:45",priority:"normal",status:"waiting",assurance:null,assur_status:null,paid:false},
  {id:"M-004",patient:"N'Goran Sophie",patientId:null,addr:"Marché Selmer, Yopougon",
   examens:[],ocr_source:null, // rien uploadé, rien saisi encore
   heure:"13:00",priority:"normal",status:"waiting",assurance:null,assur_status:null,paid:false},
];

const MATERIEL = [
  {icon:"🧪",name:"Tubes EDTA",qty:18,max:30,low:8,unit:"tubes"},
  {icon:"💉",name:"Aiguilles 21G",qty:5,max:20,low:6,unit:"unités"},
  {icon:"🩹",name:"Compresses",qty:24,max:40,low:10,unit:"pièces"},
  {icon:"🧴",name:"Gel désinfect.",qty:1,max:3,low:1,unit:"flacon"},
  {icon:"🔵",name:"Tubes SST",qty:12,max:20,low:5,unit:"tubes"},
  {icon:"🟣",name:"Tubes citrate",qty:3,max:15,low:4,unit:"tubes"},
];

const PATIENT_STEPS = [
  {label:"RDV confirmé + docs uploadés",sub:"Bulletin, carte assurance, CNI envoyés",time:"07:45",done:true},
  {label:"OCR — examens extraits",sub:"3 examens détectés sur votre bulletin",time:"07:46",done:true},
  {label:"Assurance soumise au labo",sub:"MUGEFCI · Dossier transmis",time:"08:10",done:true},
  {label:"Agent en route",sub:"Kouassi Bernard · À 8 min de chez vous",time:"09:02",active:true},
  {label:"Prélèvement & paiement",sub:"Paiement sur place après prélèvement",time:null,pending:true},
  {label:"Analyses au laboratoire",sub:"Traitement des échantillons",time:null,pending:true},
  {label:"Résultats disponibles",sub:"Notification SMS + application",time:null,pending:true},
];

const SB = {
  "Payé":"b-success","Docs collectés":"b-info","En attente validation":"b-orange",
  "Résultats prêts":"b-purple","Annulé":"b-danger","Prélèvement effectué":"b-teal",
};
const AB = {
  docs_collectes:{cls:"b-info",label:"📄 Docs collectés"},
  soumis_labo:{cls:"b-orange",label:"🏥 Soumis au labo"},
  en_validation:{cls:"b-warning",label:"⏳ En validation"},
  valide_total:{cls:"b-success",label:"✅ Total"},
  valide_partiel:{cls:"b-warning",label:"⚠️ Partiel"},
  refuse:{cls:"b-danger",label:"❌ Refusé"},
};
const OCR_SRC = {
  auto:{icon:"🤖",label:"OCR auto",cls:"b-success"},
  manual:{icon:"✋",label:"Sélection patient",cls:"b-info"},
  agent:{icon:"🏍️",label:"Saisi par agent",cls:"b-orange"},
};
const NAV_WEB = [
  {id:"dashboard",icon:"📊",label:"Tableau de bord"},
  {id:"patients",icon:"🧬",label:"Dossiers patients",badge:"6"},
  {id:"assurances",icon:"🛡️",label:"Assurances",badge:"3"},
  {id:"paiements",icon:"💳",label:"Paiements"},
  {id:"agents",icon:"🏍️",label:"Agents & Tournées"},
  {id:"stock",icon:"🧪",label:"Stock matériel"},
  {id:"rapports",icon:"📈",label:"Rapports"},
];

function calcT(p){
  const total=p.examens.reduce((s,e)=>s+e.tarif,0);
  const cov=p.examens.filter(e=>e.couvert===true).reduce((s,e)=>s+e.tarif,0);
  const nc=p.examens.filter(e=>e.couvert===false).reduce((s,e)=>s+e.tarif,0);
  const pa=Math.round(cov*0.8);const qpc=Math.round(cov*0.2);
  return{total,cov,nc,pa,qpc,partPatient:qpc+nc};
}

// ── COMPOSANT PRINCIPAL ───────────────────────────────────
export default function Prelevia(){
  const [view,setView]=useState("web");
  const [page,setPage]=useState("dashboard");
  const [modal,setModal]=useState(null);
  const [patients,setPatients]=useState(INIT_PATIENTS);
  const [missions,setMissions]=useState(INIT_MISSIONS);
  const [form,setForm]=useState({});
  const [payMethod,setPayMethod]=useState(null);
  const [toast,setToast]=useState(null);
  const [search,setSearch]=useState("");
  const [activeP,setActiveP]=useState(null);
  const [activeMission,setActiveMission]=useState(null);
  const [valForm,setValForm]=useState({});
  const [patTab,setPatTab]=useState("rdv");
  const [agentTab,setAgentTab]=useState("missions");
  const [etaMin,setEtaMin]=useState(8);
  const [revenus,setRevenus]=useState(34500);

  // OCR state (prise de RDV patient)
  const [ocrStep,setOcrStep]=useState("idle"); // idle | uploading | scanning | done
  const [ocrExamens,setOcrExamens]=useState([]);
  const [selectedExamens,setSelectedExamens]=useState([]);
  const [showCatalogue,setShowCatalogue]=useState(false);
  const [uploadedDocs,setUploadedDocs]=useState({bulletin:false,assurance_card:false,cni:false});

  // Agent: saisie examens sur mission
  const [agentExamens,setAgentExamens]=useState([]);
  const [agentPayMethod,setAgentPayMethod]=useState(null);

  const showToast=(msg,icon="✅")=>{setToast({msg,icon});setTimeout(()=>setToast(null),3500);};
  const updateP=(id,ch)=>setPatients(prev=>prev.map(p=>p.id===id?{...p,...ch}:p));
  const advanceAssur=(id,step)=>updateP(id,{statut_assurance:step});
  const confirmValidation=(id,type,vf)=>{
    const ex=patients.find(p=>p.id===id).examens.map(e=>({...e,couvert:vf[e.nom]??false}));
    updateP(id,{examens:ex,statut_assurance:type});
    setModal(null);
    showToast(type==="valide_total"?"✅ Couverture totale confirmée":"⚠️ Validation partielle enregistrée");
  };

  const confirmAgentPay=(missionId)=>{
    setMissions(prev=>prev.map(m=>m.id===missionId?{...m,status:"done",paid:true}:m));
    const m=missions.find(x=>x.id===missionId);
    const p=patients.find(x=>x.id===m.patientId);
    const amount=p?calcT(p).partPatient:15000;
    setRevenus(r=>r+amount);
    updateP(m.patientId,{statut:"Payé",paid:true});
    setModal(null);
    showToast(`💳 ${amount.toLocaleString()} XOF encaissé sur place — ${m.patient}`,"💳");
  };

  // Simulation OCR
  const handleBulletinUpload=()=>{
    setOcrStep("uploading");
    setUploadedDocs(d=>({...d,bulletin:true}));
    setTimeout(()=>{
      setOcrStep("scanning");
      setTimeout(()=>{
        const detected=simulateOCR("bulletin.jpg");
        setOcrExamens(detected);
        setSelectedExamens(detected);
        setOcrStep("done");
      },2200);
    },600);
  };

  const toggleExamen=(nom,isCat=false)=>{
    setSelectedExamens(prev=>
      prev.includes(nom)?prev.filter(e=>e!==nom):[...prev,nom]
    );
  };

  const submitNewPatient=()=>{
    const ex=selectedExamens.map(nom=>({nom,tarif:5000,couvert:null}));
    const src=ocrStep==="done"?"auto":selectedExamens.length>0?"manual":"agent";
    const np={
      id:`PRV-00${patients.length+1}`,nom:form.nom||"Nouveau patient",
      dob:form.dob||"",tel:form.tel||"",commune:form.commune||"Yopougon",
      assurance:form.assurance||null,num_carte:form.num_carte||null,
      statut:selectedExamens.length>0?"Prêt pour prélèvement":"En attente examens",
      statut_assurance:form.assurance?"docs_collectes":null,
      examens:ex.length?ex:[{nom:"À définir par l'agent",tarif:0,couvert:null}],
      docs:{
        bulletin:uploadedDocs.bulletin?"bulletin_new.jpg":null,
        assurance_card:uploadedDocs.assurance_card?"carte_assur_new.jpg":null,
        cni:uploadedDocs.cni?"cni_new.jpg":null,
      },
      ocr_source:src,prescription:`PRX-2025-00${patients.length+1}`,paid:false,
    };
    setPatients(prev=>[np,...prev]);
    setModal(null);setOcrStep("idle");setOcrExamens([]);setSelectedExamens([]);
    setUploadedDocs({bulletin:false,assurance_card:false,cni:false});
    showToast(`Dossier créé — ${np.nom} · ${ex.length} examen(s) ${src==="auto"?"(OCR ✓)":""}`);
  };

  useEffect(()=>{const t=setInterval(()=>setEtaMin(m=>m>1?m-1:1),9000);return()=>clearInterval(t);},[]);
  useEffect(()=>{const t=setInterval(()=>setRevenus(r=>r+Math.floor(Math.random()*350+120)),7500);return()=>clearInterval(t);},[]);

  const filtered=patients.filter(p=>p.nom.toLowerCase().includes(search.toLowerCase())||p.id.toLowerCase().includes(search.toLowerCase()));
  const assurP=patients.filter(p=>p.assurance&&p.statut_assurance);
  const enCours=patients.filter(p=>["docs_collectes","soumis_labo","en_validation"].includes(p.statut_assurance));
  const missingExamens=missions.filter(m=>m.examens.length===0);

  return(
    <>
      <style>{STYLES}</style>

      {/* NAV */}
      <div className="platform-nav">
        <div className="pnav-logo">Pre<span>levia</span></div>
        <div className="pnav-tabs">
          <button className={`pnav-tab ${view==="web"?"active":""}`} onClick={()=>setView("web")}>🖥️ Admin Web</button>
          <button className={`pnav-tab ${view==="patient"?"active":""}`} onClick={()=>setView("patient")}>📱 App Patient</button>
          <button className={`pnav-tab ${view==="agent"?"active":""}`} onClick={()=>setView("agent")}>📱 App Agent</button>
        </div>
        <div className="pnav-badge">🏥 Labo Maison Blanche · Yopougon</div>
      </div>

      {/* ════════════════════ WEB ADMIN ════════════════════ */}
      {view==="web"&&(
        <div className="web-wrapper">
          <aside className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-name">Pre<span>levia</span></div>
              <div className="logo-sub">Back-office</div>
            </div>
            <div className="coverage-badge"><strong>🏥 Couverture provisoire</strong>Labo Maison Blanche · Yopougon</div>
            <nav className="nav">
              <div className="nav-sec">Menu</div>
              {NAV_WEB.map(n=>(
                <div key={n.id} className={`nav-item ${page===n.id?"active":""}`} onClick={()=>setPage(n.id)}>
                  <span className="nav-icon">{n.icon}</span>{n.label}
                  {n.badge&&<span className="nav-badge">{n.badge}</span>}
                </div>
              ))}
            </nav>
            <div className="sidebar-footer">
              <div className="user-card">
                <div className="user-avatar">AD</div>
                <div><div className="user-name">Admin Prelevia</div><div className="user-role">Administrateur</div></div>
              </div>
            </div>
          </aside>

          <main className="main">
            <div className="topbar">
              <div>
                <span className="topbar-title">{NAV_WEB.find(n=>n.id===page)?.icon} {NAV_WEB.find(n=>n.id===page)?.label}</span>
                <span className="topbar-sub">· 18 mars 2026</span>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn btn-outline btn-sm" onClick={()=>setView("patient")}>📱 App Patient</button>
                <button className="btn btn-outline btn-sm" onClick={()=>setView("agent")}>📱 App Agent</button>
                <button className="btn btn-primary" onClick={()=>{setForm({});setOcrStep("idle");setSelectedExamens([]);setOcrExamens([]);setUploadedDocs({bulletin:false,assurance_card:false,cni:false});setModal("new_patient");}}>＋ Nouveau dossier</button>
              </div>
            </div>

            <div className="content">

              {/* DASHBOARD */}
              {page==="dashboard"&&(
                <>
                  <div className="stats-grid">
                    {[
                      {icon:"🧬",val:"24",label:"Patients du jour",ch:"↑ 4 vs hier",col:C.primary,bg:"rgba(10,110,92,0.1)"},
                      {icon:"🤖",val:`${patients.filter(p=>p.ocr_source==="auto").length}`,label:"Examens via OCR",ch:"extraction auto",col:C.success,bg:"rgba(44,182,125,0.1)"},
                      {icon:"🛡️",val:enCours.length.toString(),label:"Assurances en cours",ch:"à traiter",col:C.orange,bg:"rgba(249,115,22,0.1)",click:true},
                      {icon:"⚠️",val:missingExamens.length.toString(),label:"Examens manquants",ch:"à saisir par agent",col:C.danger,bg:"rgba(224,92,92,0.1)"},
                    ].map((s,i)=>(
                      <div className="stat-card" key={i} onClick={()=>s.click&&setPage("assurances")} style={{cursor:s.click?"pointer":"default"}}>
                        <div className="stat-icon" style={{background:s.bg,color:s.col}}>{s.icon}</div>
                        <div className="stat-value" style={{color:s.col,fontSize:s.val.length>4?18:24}}>{s.val}</div>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-change">{s.ch}</div>
                        <div className="stat-deco">{s.icon}</div>
                      </div>
                    ))}
                  </div>

                  <div className="quick-actions">
                    <div className="qa-card" onClick={()=>{setForm({});setOcrStep("idle");setSelectedExamens([]);setOcrExamens([]);setUploadedDocs({bulletin:false,assurance_card:false,cni:false});setModal("new_patient");}}>
                      <div className="qa-icon" style={{background:"rgba(10,110,92,0.1)"}}>🧬</div>
                      <div><div className="qa-label">Nouveau dossier</div><div className="qa-sub">Avec upload bulletin + OCR</div></div>
                    </div>
                    <div className="qa-card" onClick={()=>setPage("assurances")}>
                      <div className="qa-icon" style={{background:"rgba(249,115,22,0.1)"}}>🛡️</div>
                      <div><div className="qa-label">Assurances</div><div className="qa-sub">{enCours.length} en cours</div></div>
                    </div>
                    <div className="qa-card" onClick={()=>setPage("agents")}>
                      <div className="qa-icon" style={{background:"rgba(59,130,246,0.1)"}}>🏍️</div>
                      <div><div className="qa-label">Tournées agents</div><div className="qa-sub">{missingExamens.length} examens à saisir</div></div>
                    </div>
                  </div>

                  <div className="dash-grid">
                    <div className="section">
                      <div className="section-header">
                        <div><div className="section-title">Dossiers récents</div></div>
                        <button className="btn btn-outline btn-sm" onClick={()=>setPage("patients")}>Voir tout</button>
                      </div>
                      <div className="scrollable">
                        <table className="table">
                          <thead><tr><th>Patient</th><th>Examens</th><th>Source examens</th><th>Docs uploadés</th><th>Statut</th><th>Part client</th></tr></thead>
                          <tbody>{patients.slice(0,5).map(p=>{
                            const t=calcT(p);const src=OCR_SRC[p.ocr_source]||OCR_SRC.manual;
                            const docsCount=[p.docs.bulletin,p.docs.assurance_card,p.docs.cni].filter(Boolean).length;
                            return(
                              <tr key={p.id}>
                                <td><div style={{fontWeight:600}}>{p.nom}</div><div style={{fontSize:11,color:C.textLight}}>{p.id}</div></td>
                                <td>{p.examens.slice(0,2).map(e=><span key={e.nom} className="badge b-neutral" style={{marginRight:3}}>{e.nom}</span>)}{p.examens.length>2&&<span className="badge b-neutral">+{p.examens.length-2}</span>}</td>
                                <td><span className={`badge ${src.cls}`}>{src.icon} {src.label}</span></td>
                                <td>
                                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                                    {["📄","🛡️","🪪"].map((icon,i)=>{
                                      const keys=["bulletin","assurance_card","cni"];
                                      const has=p.docs[keys[i]];
                                      return <span key={i} style={{fontSize:14,opacity:has?1:0.2,filter:has?"none":"grayscale(1)"}}>{icon}</span>;
                                    })}
                                    <span style={{fontSize:11,color:docsCount===3?C.success:C.textLight,marginLeft:2}}>{docsCount}/3</span>
                                  </div>
                                </td>
                                <td><span className={`badge ${SB[p.statut]||"b-neutral"}`}>{p.statut}</span></td>
                                <td style={{fontWeight:700,color:C.primary}}>{t.partPatient.toLocaleString()} XOF</td>
                              </tr>
                            );
                          })}</tbody>
                        </table>
                      </div>
                    </div>
                    <div className="section">
                      <div className="section-header"><div className="section-title">🤖 OCR — Statut</div></div>
                      <div style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
                        {[
                          {l:"🤖 OCR automatique",k:"auto",col:C.success},
                          {l:"✋ Sélection manuelle",k:"manual",col:C.info},
                          {l:"🏍️ Saisi par agent",k:"agent",col:C.orange},
                          {l:"⚠️ Aucun examen",k:null,col:C.danger},
                        ].map(s=>{
                          const count=s.k===null?patients.filter(p=>p.examens.length===0).length:patients.filter(p=>p.ocr_source===s.k).length;
                          return(
                            <div key={s.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 11px",background:C.bg,borderRadius:9}}>
                              <span style={{fontSize:12,fontWeight:500}}>{s.l}</span>
                              <span style={{fontWeight:800,fontSize:15,color:s.col}}>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{padding:"0 14px 14px"}}>
                        <div className="info-teal info-banner" style={{margin:0}}>
                          💡 Le patient uploade son bulletin lors du RDV. L'OCR extrait automatiquement les examens. L'agent les voit avant d'arriver.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* PATIENTS */}
              {page==="patients"&&(
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                    <div className="search-bar"><span>🔍</span><input placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
                    <button className="btn btn-primary" onClick={()=>{setForm({});setOcrStep("idle");setSelectedExamens([]);setOcrExamens([]);setUploadedDocs({bulletin:false,assurance_card:false,cni:false});setModal("new_patient");}}>＋ Nouveau dossier</button>
                  </div>
                  <div className="section">
                    <div className="section-header"><div><div className="section-title">Dossiers patients</div><div className="section-sub">{filtered.length} dossiers</div></div></div>
                    <div className="scrollable">
                      <table className="table">
                        <thead><tr><th>ID</th><th>Patient</th><th>Commune</th><th>Examens</th><th>Source</th><th>Documents</th><th>Assurance</th><th>Statut</th><th>Payé</th><th>Actions</th></tr></thead>
                        <tbody>{filtered.map(p=>{
                          const t=calcT(p);const ab=AB[p.statut_assurance];const src=OCR_SRC[p.ocr_source]||OCR_SRC.manual;
                          return(
                            <tr key={p.id}>
                              <td style={{fontFamily:"monospace",fontSize:11,color:C.textLight}}>{p.id}</td>
                              <td><div style={{fontWeight:600}}>{p.nom}</div><div style={{fontSize:11,color:C.textLight}}>{p.tel}</div></td>
                              <td><span className={p.commune==="Yopougon"?"commune-tag":"badge b-neutral"}>{p.commune==="Yopougon"&&"📍"} {p.commune}</span></td>
                              <td>{p.examens.slice(0,2).map(e=><span key={e.nom} className="badge b-neutral" style={{marginRight:3}}>{e.nom}</span>)}{p.examens.length>2&&<span className="badge b-neutral">+{p.examens.length-2}</span>}</td>
                              <td><span className={`badge ${src.cls}`}>{src.icon} {src.label}</span></td>
                              <td>
                                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                                  <span title="Bulletin" style={{fontSize:15,opacity:p.docs.bulletin?1:0.25}}>📄</span>
                                  <span title="Carte assurance" style={{fontSize:15,opacity:p.docs.assurance_card?1:0.25}}>🛡️</span>
                                  <span title="CNI" style={{fontSize:15,opacity:p.docs.cni?1:0.25}}>🪪</span>
                                </div>
                              </td>
                              <td>{p.assurance?<span className="badge b-info">🛡️ {p.assurance}</span>:<span style={{color:C.textLight,fontSize:12}}>—</span>}</td>
                              <td><span className={`badge ${SB[p.statut]||"b-neutral"}`}>{p.statut}</span>{ab&&<div style={{marginTop:3}}><span className={`badge ${ab.cls}`} style={{fontSize:10}}>{ab.label}</span></div>}</td>
                              <td>{p.paid?<span className="badge b-success">✅ Payé</span>:<span className="badge b-warning">⏳ En attente</span>}</td>
                              <td>
                                <div style={{display:"flex",gap:5}}>
                                  {p.assurance&&p.statut_assurance&&<button className="btn btn-info btn-sm" onClick={()=>{setActiveP({...p});setValForm({});setModal("assurance");}}>🛡️</button>}
                                  {p.docs.bulletin&&<button className="btn btn-outline btn-sm" onClick={()=>showToast(`Bulletin de ${p.nom} visualisé`,"📄")}>📄</button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}</tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* ASSURANCES */}
              {page==="assurances"&&(
                <>
                  <div className="info-blue info-banner" style={{marginBottom:18}}>
                    <strong>Nouveau flux :</strong> Le patient uploade ses documents (carte assurance, CNI, bulletin) dès la prise de RDV → Prelevia transmet immédiatement au labo → Le labo soumet à l'assureur <strong>avant même la visite de l'agent</strong> → La décision peut être disponible au moment du prélèvement.
                  </div>
                  {[
                    {key:"docs_collectes",title:"📄 Documents uploadés — à envoyer au labo",col:C.info,action:"🏥 Marquer envoyé au labo",next:"soumis_labo"},
                    {key:"soumis_labo",title:"🏥 Soumis au labo — attente portail assureur",col:C.orange,action:"⏳ Confirmer soumission portail",next:"en_validation"},
                    {key:"en_validation",title:"⏳ En cours de validation par l'assureur",col:"#B45309",action:null,next:null},
                    {key:"valide_total",title:"✅ Couverture totale validée",col:C.success,action:null,next:null},
                    {key:"valide_partiel",title:"⚠️ Couverture partielle",col:C.orange,action:null,next:null},
                  ].map(({key,title,col,action,next})=>{
                    const grp=assurP.filter(p=>p.statut_assurance===key);
                    if(!grp.length) return null;
                    return(
                      <div className="section" key={key}>
                        <div className="section-header" style={{borderLeft:`4px solid ${col}`}}>
                          <div><div className="section-title" style={{color:col}}>{title}</div><div className="section-sub">{grp.length} dossier(s)</div></div>
                        </div>
                        <div className="scrollable">
                          <table className="table">
                            <thead><tr><th>Patient</th><th>Assurance</th><th>Documents uploadés</th><th>Examens (source OCR)</th><th>Récap</th><th>Actions</th></tr></thead>
                            <tbody>{grp.map(p=>{
                              const t=calcT(p);const src=OCR_SRC[p.ocr_source]||OCR_SRC.manual;
                              return(
                                <tr key={p.id}>
                                  <td><div style={{fontWeight:600}}>{p.nom}</div><div style={{fontSize:11,color:C.textLight}}>{p.prescription}</div></td>
                                  <td><span className="badge b-info">🛡️ {p.assurance}</span>{p.num_carte&&<div style={{fontSize:11,color:C.textLight,marginTop:2}}>{p.num_carte}</div>}</td>
                                  <td>
                                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                                      {[{k:"bulletin",icon:"📄",label:"Bulletin"},{k:"assurance_card",icon:"🛡️",label:"Carte assur."},{k:"cni",icon:"🪪",label:"CNI"}].map(d=>(
                                        <div key={d.k} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
                                          <span style={{opacity:p.docs[d.k]?1:0.3}}>{d.icon}</span>
                                          <span style={{color:p.docs[d.k]?C.success:C.danger,fontWeight:600}}>{p.docs[d.k]?d.label+" ✓":"Manquant"}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                  <td>
                                    <div style={{marginBottom:4}}><span className={`badge ${src.cls}`} style={{fontSize:10}}>{src.icon} {src.label}</span></div>
                                    {p.examens.map(e=>(
                                      <div key={e.nom} style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                                        <span style={{fontSize:12,fontWeight:600}}>{e.nom}</span>
                                        {e.couvert===true&&<span className="badge b-success" style={{fontSize:10}}>✅</span>}
                                        {e.couvert===false&&<span className="badge b-danger" style={{fontSize:10}}>❌</span>}
                                        {e.couvert===null&&<span className="badge b-neutral" style={{fontSize:10}}>?</span>}
                                      </div>
                                    ))}
                                  </td>
                                  <td>
                                    {(key==="valide_total"||key==="valide_partiel")?(
                                      <div style={{fontSize:12}}>
                                        {t.pa>0&&<div style={{color:C.success}}>✅ {t.pa.toLocaleString()} XOF</div>}
                                        {t.nc>0&&<div style={{color:C.danger}}>❌ {t.nc.toLocaleString()} XOF</div>}
                                        <div style={{fontWeight:800,color:C.primary}}>👤 {t.partPatient.toLocaleString()} XOF</div>
                                      </div>
                                    ):<span style={{color:C.textLight,fontSize:12}}>En attente</span>}
                                  </td>
                                  <td>
                                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                                      {action&&next&&<button className="btn btn-primary btn-sm" onClick={()=>{advanceAssur(p.id,next);showToast(`Dossier ${p.nom} avancé`,"🏥");}}>{action}</button>}
                                      {key==="en_validation"&&<button className="btn btn-accent btn-sm" onClick={()=>{setActiveP({...p});setValForm({});setModal("validation");}}>📋 Saisir résultat</button>}
                                      <button className="btn btn-outline btn-sm" onClick={()=>{setActiveP({...p});setValForm({});setModal("assurance");}}>👁️ Détail</button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}</tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* AGENTS */}
              {page==="agents"&&(
                <>
                  <div className="stats-grid" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
                    {[
                      {icon:"🏍️",val:"4",label:"Agents actifs",col:C.success,bg:"rgba(44,182,125,0.1)"},
                      {icon:"🤖",val:missions.filter(m=>m.ocr_source==="auto").length.toString(),label:"Examens via OCR",col:C.success,bg:"rgba(44,182,125,0.1)"},
                      {icon:"⚠️",val:missingExamens.length.toString(),label:"Examens à saisir",col:C.danger,bg:"rgba(224,92,92,0.1)"},
                      {icon:"💰",val:"138 500 XOF",label:"Revenus agents",col:C.accent,bg:"rgba(244,167,38,0.1)"},
                    ].map((s,i)=>(
                      <div className="stat-card" key={i}>
                        <div className="stat-icon" style={{background:s.bg,color:s.col}}>{s.icon}</div>
                        <div className="stat-value" style={{color:s.col,fontSize:s.val.length>6?15:22}}>{s.val}</div>
                        <div className="stat-label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="section">
                    <div className="section-header">
                      <div><div className="section-title">🗺️ Tournée — Kouassi Bernard</div></div>
                      <button className="btn btn-primary btn-sm" onClick={()=>setView("agent")}>📱 Vue App Agent</button>
                    </div>
                    <div className="scrollable">
                      <table className="table">
                        <thead><tr><th>Mission</th><th>Patient</th><th>Adresse</th><th>Examens</th><th>Source examens</th><th>Assurance</th><th>Paiement</th><th>Statut</th></tr></thead>
                        <tbody>{missions.map(m=>{
                          const src=m.ocr_source?OCR_SRC[m.ocr_source]:null;
                          return(
                            <tr key={m.id} style={{background:m.examens.length===0?"rgba(224,92,92,0.04)":"inherit"}}>
                              <td style={{fontFamily:"monospace",fontSize:11,color:C.textLight}}>{m.id}</td>
                              <td style={{fontWeight:600}}>{m.patient}</td>
                              <td style={{fontSize:12,color:C.textLight}}>📍 {m.addr}</td>
                              <td>
                                {m.examens.length>0
                                  ?m.examens.map(e=><span key={e} className="badge b-neutral" style={{marginRight:3}}>{e}</span>)
                                  :<span className="badge b-danger">⚠️ À saisir par agent</span>}
                              </td>
                              <td>{src?<span className={`badge ${src.cls}`}>{src.icon} {src.label}</span>:<span style={{color:C.danger,fontSize:12}}>—</span>}</td>
                              <td>{m.assurance?<span className="badge b-info">🛡️ {m.assurance}</span>:<span style={{color:C.textLight,fontSize:12}}>—</span>}</td>
                              <td>{m.paid?<span className="badge b-success">✅ Payé</span>:<span className="badge b-warning">⏳ Sur place</span>}</td>
                              <td>{m.status==="done"?<span className="badge b-success">✅</span>:m.status==="active"?<span className="badge b-orange">▶</span>:<span className="badge b-neutral">En attente</span>}</td>
                            </tr>
                          );
                        })}</tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* PAIEMENTS */}
              {page==="paiements"&&(
                <>
                  <div className="info-teal info-banner" style={{marginBottom:18}}>
                    💳 <strong>Paiement immédiat après prélèvement :</strong> L'agent encaisse sur place, juste après avoir effectué le prélèvement. Pour les patients assurés, la décision peut déjà être disponible (docs uploadés dès le RDV → soumis au labo avant la visite).
                  </div>
                  <div className="stats-grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
                    {[
                      {icon:"💰",val:"4 820 000 XOF",label:"CA mensuel",col:C.success,bg:"rgba(44,182,125,0.1)"},
                      {icon:"🛡️",val:"1 240 000 XOF",label:"Remboursements assurance",col:C.info,bg:"rgba(59,130,246,0.1)"},
                      {icon:"⏳",val:patients.filter(p=>!p.paid).length.toString(),label:"Paiements en attente",col:C.accent,bg:"rgba(244,167,38,0.1)"},
                    ].map((s,i)=><div className="stat-card" key={i}><div className="stat-icon" style={{background:s.bg,color:s.col}}>{s.icon}</div><div className="stat-value" style={{color:s.col,fontSize:s.val.length>9?16:24}}>{s.val}</div><div className="stat-label">{s.label}</div></div>)}
                  </div>
                  <div className="section">
                    <div className="section-header"><div className="section-title">Historique des paiements</div></div>
                    <div className="scrollable"><table className="table">
                      <thead><tr><th>Réf.</th><th>Patient</th><th>Couverture assurance</th><th>Examens non couverts</th><th>Quote-part client</th><th>Total client</th><th>Payé sur place</th></tr></thead>
                      <tbody>{patients.map(p=>{const t=calcT(p);return(
                        <tr key={p.id}>
                          <td style={{fontFamily:"monospace",fontSize:11,color:C.textLight}}>{p.prescription}</td>
                          <td style={{fontWeight:600}}>{p.nom}</td>
                          <td style={{color:C.success,fontWeight:600}}>{t.pa>0?`${t.pa.toLocaleString()} XOF`:"—"}</td>
                          <td style={{color:C.danger,fontWeight:600}}>{t.nc>0?`${t.nc.toLocaleString()} XOF`:"—"}</td>
                          <td style={{color:C.orange,fontWeight:600}}>{t.qpc>0?`${t.qpc.toLocaleString()} XOF`:"—"}</td>
                          <td style={{fontWeight:800,color:C.primary}}>{t.partPatient.toLocaleString()} XOF</td>
                          <td>{p.paid?<span className="badge b-success">✅ Payé après prélèvement</span>:<span className="badge b-warning">⏳ En attente</span>}</td>
                        </tr>
                      );})}
                      </tbody>
                    </table></div>
                  </div>
                </>
              )}

              {/* STOCK */}
              {page==="stock"&&(
                <>
                  <div className="stats-grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
                    {[
                      {icon:"✅",val:MATERIEL.filter(m=>m.qty>m.low).length.toString(),label:"Stocks OK",col:C.success,bg:"rgba(44,182,125,0.1)"},
                      {icon:"⚠️",val:MATERIEL.filter(m=>m.qty<=m.low&&m.qty>2).length.toString(),label:"Stocks bas",col:C.orange,bg:"rgba(249,115,22,0.1)"},
                      {icon:"🚨",val:MATERIEL.filter(m=>m.qty<=2).length.toString(),label:"Rupture imminente",col:C.danger,bg:"rgba(224,92,92,0.1)"},
                    ].map((s,i)=><div className="stat-card" key={i}><div className="stat-icon" style={{background:s.bg,color:s.col}}>{s.icon}</div><div className="stat-value" style={{color:s.col}}>{s.val}</div><div className="stat-label">{s.label}</div></div>)}
                  </div>
                  <div className="section">
                    <div className="section-header"><div className="section-title">🧪 Inventaire — Kouassi Bernard</div><button className="btn btn-primary btn-sm">📦 Réapprovisionnement</button></div>
                    <div className="scrollable"><table className="table">
                      <thead><tr><th>Matériel</th><th>Quantité</th><th>Seuil</th><th>Max</th><th>Niveau</th><th>Statut</th></tr></thead>
                      <tbody>{MATERIEL.map(m=>{
                        const pct=Math.round(m.qty/m.max*100);
                        const col=m.qty<=2?C.danger:m.qty<=m.low?C.orange:C.success;
                        return(
                          <tr key={m.name}>
                            <td style={{fontWeight:600}}>{m.icon} {m.name}</td>
                            <td style={{fontWeight:800,color:col,fontSize:15}}>{m.qty} <span style={{fontSize:12,color:C.textLight,fontWeight:400}}>{m.unit}</span></td>
                            <td style={{color:C.textLight}}>{m.low}</td><td style={{color:C.textLight}}>{m.max}</td>
                            <td style={{width:120}}><div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:3}}/></div><div style={{fontSize:10,color:C.textLight,marginTop:2}}>{pct}%</div></td>
                            <td>{m.qty<=2?<span className="badge b-danger">🚨 Rupture</span>:m.qty<=m.low?<span className="badge b-orange">⚠️ Bas</span>:<span className="badge b-success">✅ OK</span>}</td>
                          </tr>
                        );
                      })}</tbody>
                    </table></div>
                  </div>
                </>
              )}

              {/* RAPPORTS */}
              {page==="rapports"&&(
                <div>
                  <div className="stats-grid">
                    {[{icon:"👥",val:"312",label:"Patients ce mois",col:C.primary,bg:"rgba(10,110,92,0.1)"},{icon:"🤖",val:"78%",label:"Bulletins avec OCR",col:C.success,bg:"rgba(44,182,125,0.1)"},{icon:"💰",val:"4 820 000",label:"CA mensuel (XOF)",col:C.accent,bg:"rgba(244,167,38,0.1)"},{icon:"📍",val:"78%",label:"Clients Yopougon",col:C.info,bg:"rgba(59,130,246,0.1)"}].map((s,i)=>(
                      <div className="stat-card" key={i}><div className="stat-icon" style={{background:s.bg,color:s.col}}>{s.icon}</div><div className="stat-value" style={{color:s.col,fontSize:s.val.length>6?18:24}}>{s.val}</div><div className="stat-label">{s.label}</div></div>
                    ))}
                  </div>
                  <div className="dash-grid">
                    <div className="section">
                      <div className="section-header"><div className="section-title">📊 Examens les plus demandés</div></div>
                      <div style={{padding:18,display:"flex",flexDirection:"column",gap:10}}>
                        {[{n:"NFS",c:89,p:80},{n:"Glycémie",c:74,p:67},{n:"Bilan rénal",c:58,p:52},{n:"HbA1c",c:45,p:40},{n:"TSH",c:38,p:34}].map(e=>(
                          <div key={e.n}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{fontWeight:600}}>{e.n}</span><span style={{color:C.textLight}}>{e.c}</span></div>
                          <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${e.p}%`,background:C.primary,borderRadius:3}}/></div></div>
                        ))}
                      </div>
                    </div>
                    <div className="section">
                      <div className="section-header"><div className="section-title">🤖 Sources des examens</div></div>
                      <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
                        {[{l:"🤖 OCR automatique",p:62,col:C.success},{l:"✋ Sélection manuelle",p:24,col:C.info},{l:"🏍️ Saisi par agent",p:14,col:C.orange}].map(x=>(
                          <div key={x.l} style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{flex:1,fontSize:12,fontWeight:500}}>{x.l}</div>
                            <div style={{width:80,height:7,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${x.p}%`,background:x.col,borderRadius:3}}/></div>
                            <div style={{fontSize:12,fontWeight:700,width:32,color:x.col}}>{x.p}%</div>
                          </div>
                        ))}
                      </div>
                      <div style={{margin:"0 14px 14px",padding:10,background:"rgba(10,110,92,0.06)",borderRadius:9,fontSize:11,color:C.primaryDark}}>
                        📍 <strong>Yopougon</strong> = clientèle exclusive Labo Maison Blanche.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* ════════════════════ APP PATIENT ════════════════════ */}
      {view==="patient"&&(
        <div className="mobile-wrapper">
          <div className="mobile-scene">
            <div>
              <div className="phone-frame">
                <div className="phone-notch"/>
                <div className="p-app">
                  <div className="p-header">
                    <div className="p-greeting">Bonjour 👋</div>
                    <div className="p-name">Koné Aminata</div>
                    <div className="p-rdv">
                      <span style={{fontSize:20}}>📅</span>
                      <div><div className="p-rdv-val">Prélèvement à domicile · 09h15</div><div className="p-rdv-sub">Aujourd'hui · Yopougon</div></div>
                    </div>
                    <div className="p-tabs" style={{marginTop:12}}>
                      {[["rdv","📋 Mon RDV"],["suivi","📍 Suivi"],["resultats","🧬 Résultats"]].map(([k,l])=>(
                        <div key={k} className={`p-tab ${patTab===k?"active":""}`} onClick={()=>setPatTab(k)}>{l}</div>
                      ))}
                    </div>
                  </div>

                  <div className="p-content">

                    {/* ── ONGLET RDV — Upload + OCR ── */}
                    {patTab==="rdv"&&(
                      <>
                        {/* Statut docs */}
                        <div style={{background:"#fff",borderRadius:14,padding:14,boxShadow:"0 3px 14px rgba(0,0,0,0.05)",marginBottom:12}}>
                          <div style={{fontSize:12,fontWeight:700,marginBottom:10,color:C.text}}>📎 Mes documents</div>
                          {[
                            {key:"bulletin",icon:"📄",label:"Bulletin d'analyses",required:true},
                            {key:"assurance_card",icon:"🛡️",label:"Carte d'assurance",required:false},
                            {key:"cni",icon:"🪪",label:"Pièce d'identité",required:false},
                          ].map(doc=>(
                            <div key={doc.key} className={`m-doc-row ${uploadedDocs[doc.key]?"done":"pending"}`} onClick={()=>{setUploadedDocs(d=>({...d,[doc.key]:true}));if(doc.key==="bulletin"&&!uploadedDocs.bulletin)handleBulletinUpload();}}>
                              <span style={{fontSize:20}}>{doc.icon}</span>
                              <div style={{flex:1}}>
                                <div style={{fontSize:12,fontWeight:700,color:C.text}}>{doc.label}</div>
                                {doc.required&&<div style={{fontSize:10,color:C.orange}}>Obligatoire</div>}
                              </div>
                              {uploadedDocs[doc.key]
                                ?<span style={{fontSize:11,color:C.success,fontWeight:700}}>✅ Envoyé</span>
                                :<span style={{fontSize:11,color:C.primary,fontWeight:700}}>📤 Envoyer</span>}
                            </div>
                          ))}
                        </div>

                        {/* OCR */}
                        {ocrStep==="idle"&&(
                          <div className="m-upload-zone" onClick={handleBulletinUpload}>
                            <div style={{fontSize:28,marginBottom:6}}>📷</div>
                            <div style={{fontSize:13,fontWeight:700,color:C.text}}>Scanner mon bulletin</div>
                            <div style={{fontSize:11,color:C.textLight,marginTop:3}}>Photo ou fichier · OCR automatique</div>
                          </div>
                        )}

                        {ocrStep==="uploading"&&(
                          <div className="m-ocr-scanning">
                            <div className="m-ocr-spinner"/>
                            <div><div style={{fontSize:12,fontWeight:700,color:C.text}}>Envoi en cours...</div><div style={{fontSize:11,color:C.textLight}}>bulletin_analyses.jpg</div></div>
                          </div>
                        )}

                        {ocrStep==="scanning"&&(
                          <div className="m-ocr-scanning">
                            <div className="m-ocr-spinner"/>
                            <div>
                              <div style={{fontSize:12,fontWeight:700,color:C.info}}>🤖 Analyse OCR en cours...</div>
                              <div style={{fontSize:11,color:C.textLight}}>Extraction des examens du bulletin</div>
                            </div>
                          </div>
                        )}

                        {ocrStep==="done"&&(
                          <div style={{background:"#fff",borderRadius:14,padding:14,boxShadow:"0 3px 14px rgba(0,0,0,0.05)",marginBottom:12}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                              <span style={{fontSize:16}}>🤖</span>
                              <div>
                                <div style={{fontSize:12,fontWeight:700,color:C.success}}>OCR — {ocrExamens.length} examens détectés</div>
                                <div style={{fontSize:10,color:C.textLight}}>Confirmez ou ajustez la liste</div>
                              </div>
                            </div>
                            <div className="m-exam-grid">
                              {ocrExamens.map(e=>(
                                <div key={e} className={`m-exam-chip ocr ${selectedExamens.includes(e)?"sel":""}`} onClick={()=>toggleExamen(e)}>
                                  {selectedExamens.includes(e)?"✓ ":""}{e}
                                </div>
                              ))}
                            </div>
                            <div style={{marginTop:10,borderTop:`1px solid ${C.border}`,paddingTop:10}}>
                              <div style={{fontSize:11,color:C.textLight,marginBottom:7,fontWeight:600}}>Ajouter manuellement</div>
                              <div className="m-exam-grid">
                                {EXAMENS_CATALOGUE.filter(e=>!ocrExamens.includes(e)).slice(0,showCatalogue?999:8).map(e=>(
                                  <div key={e} className={`m-exam-chip cat ${selectedExamens.includes(e)?"sel":""}`} onClick={()=>toggleExamen(e,true)}>
                                    {selectedExamens.includes(e)?"✓ ":""}{e}
                                  </div>
                                ))}
                                {!showCatalogue&&<div className="m-exam-chip cat" onClick={()=>setShowCatalogue(true)} style={{background:"rgba(10,110,92,0.06)",color:C.primary,borderColor:C.border}}>+ Voir tout</div>}
                              </div>
                            </div>
                            <div style={{marginTop:10,padding:"8px 12px",background:"rgba(10,110,92,0.07)",borderRadius:9,fontSize:11,color:C.primaryDark}}>
                              ✅ <strong>{selectedExamens.length} examen(s) confirmé(s)</strong> · L'agent les connaîtra avant d'arriver
                            </div>
                          </div>
                        )}

                        {/* Sélection manuelle si pas de bulletin */}
                        {ocrStep==="idle"&&(
                          <div style={{background:"#fff",borderRadius:14,padding:14,boxShadow:"0 3px 14px rgba(0,0,0,0.05)"}}>
                            <div style={{fontSize:12,fontWeight:700,marginBottom:8,color:C.text}}>✋ Sélection manuelle</div>
                            <div style={{fontSize:11,color:C.textLight,marginBottom:8}}>Si vous n'avez pas votre bulletin, sélectionnez vos examens :</div>
                            <div className="m-exam-grid">
                              {EXAMENS_CATALOGUE.slice(0,showCatalogue?999:10).map(e=>(
                                <div key={e} className={`m-exam-chip cat ${selectedExamens.includes(e)?"sel":""}`} onClick={()=>toggleExamen(e,true)}>
                                  {selectedExamens.includes(e)?"✓ ":""}{e}
                                </div>
                              ))}
                              {!showCatalogue&&<div className="m-exam-chip cat" onClick={()=>setShowCatalogue(true)} style={{background:"rgba(10,110,92,0.06)",color:C.primary,borderColor:C.border}}>+ Voir tout</div>}
                            </div>
                            {selectedExamens.length>0&&<div style={{marginTop:10,fontSize:11,color:C.success,fontWeight:600}}>✓ {selectedExamens.length} examen(s) sélectionné(s)</div>}
                          </div>
                        )}
                      </>
                    )}

                    {/* ── ONGLET SUIVI ── */}
                    {patTab==="suivi"&&(
                      <>
                        {/* Statut docs uploadés */}
                        <div style={{background:"rgba(10,110,92,0.07)",border:"1px solid rgba(10,110,92,0.15)",borderRadius:12,padding:12,marginBottom:12}}>
                          <div style={{fontSize:12,fontWeight:700,color:C.primaryDark,marginBottom:6}}>📎 Documents envoyés</div>
                          <div style={{display:"flex",gap:8}}>
                            {[{icon:"📄",label:"Bulletin",ok:true},{icon:"🛡️",label:"MUGEFCI",ok:true},{icon:"🪪",label:"CNI",ok:true}].map((d,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(44,182,125,0.1)",borderRadius:8,padding:"4px 9px"}}>
                                <span style={{fontSize:13}}>{d.icon}</span>
                                <span style={{fontSize:10,fontWeight:700,color:C.success}}>{d.label} ✓</span>
                              </div>
                            ))}
                          </div>
                          <div style={{marginTop:8,fontSize:11,color:C.primaryDark}}>
                            🤖 OCR : <strong>NFS, Glycémie, Bilan lipidique</strong> détectés · Dossier transmis à MUGEFCI
                          </div>
                        </div>

                        {/* Carte */}
                        <div className="tracker-card">
                          <div className="tc-title"><span>📍</span> Agent en route</div>
                          <div className="tc-map">
                            <div className="map-grid"/><div className="road-h" style={{top:"38%"}}/><div className="road-h" style={{top:"63%"}}/><div className="road-v" style={{left:"28%"}}/><div className="road-v" style={{left:"58%"}}/>
                            <div className="pin-pulse"/><div className="pin-home">🏠</div><div className="pin-agent">🏍</div>
                            <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
                              <polyline points="83,77 83,57 142,57 190,57" stroke="#0A6E5C" strokeWidth="2.5" fill="none" strokeDasharray="5,4" opacity="0.65"/>
                            </svg>
                          </div>
                          <div className="eta-row">
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div className="eta-avatar">KB</div>
                              <div><div className="eta-name">Kouassi Bernard</div><div className="eta-sub">Connaît vos examens · ⭐ 4.9</div></div>
                            </div>
                            <div><div className="eta-min">{etaMin} min</div><div className="eta-lbl">temps estimé</div></div>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="tracker-card">
                          <div className="tc-title"><span>⏱</span> Suivi de votre dossier</div>
                          <div className="tl">
                            {PATIENT_STEPS.map((s,i)=>(
                              <div key={i} className={`tl-item ${s.done?"done":s.active?"tl-active":"tl-pending"}`}>
                                <div style={{position:"relative"}}>
                                  {i<PATIENT_STEPS.length-1&&<div className="tl-line"/>}
                                  <div className="tl-dot">{s.done?"✓":s.active?"●":i+1}</div>
                                </div>
                                <div className="tl-body">
                                  <div className="tl-title">{s.label}</div>
                                  <div className="tl-sub">{s.sub}</div>
                                  {s.time&&<div className="tl-time">{s.time}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Info paiement */}
                        <div style={{background:"rgba(244,167,38,0.08)",border:"1px solid rgba(244,167,38,0.2)",borderRadius:12,padding:12}}>
                          <div style={{fontSize:12,fontWeight:700,color:"#92400e",marginBottom:4}}>💳 Paiement sur place</div>
                          <div style={{fontSize:11,color:"#92400e"}}>Vous paierez directement à l'agent après le prélèvement. Part assurance : 6 000 XOF · <strong>Votre part : 9 000 XOF</strong></div>
                        </div>
                      </>
                    )}

                    {/* ── ONGLET RÉSULTATS ── */}
                    {patTab==="resultats"&&(
                      <>
                        <div style={{background:"rgba(44,182,125,0.07)",border:"1px solid rgba(44,182,125,0.18)",borderRadius:12,padding:12,marginBottom:12,display:"flex",alignItems:"center",gap:9}}>
                          <span style={{fontSize:20}}>✅</span>
                          <div><div style={{fontSize:12,fontWeight:700,color:"#065f46"}}>Résultats disponibles</div><div style={{fontSize:11,color:C.textLight}}>Analysés 17/03 · Validés Dr. Assi</div></div>
                        </div>
                        <div className="res-card" style={{background:"linear-gradient(135deg,#0A6E5C,#12937A)"}}>
                          <div className="res-title">🩸 NFS</div>
                          {[{n:"Hémoglobine",v:"12.4 g/dL",ok:true},{n:"Globules blancs",v:"6.2 G/L",ok:true},{n:"Plaquettes",v:"185 G/L",ok:true}].map(r=>(
                            <div key={r.n} className="res-row"><span>{r.n}</span><span className={`res-val ${r.ok?"rv-ok":"rv-alert"}`}>{r.v}</span></div>
                          ))}
                        </div>
                        <div className="res-card" style={{background:"linear-gradient(135deg,#4a1942,#6b2f64)"}}>
                          <div className="res-title">🫀 Bilan lipidique</div>
                          {[{n:"Cholestérol",v:"6.2 mmol/L",ok:false},{n:"LDL",v:"4.1 mmol/L",ok:false},{n:"HDL",v:"1.2 mmol/L",ok:true}].map(r=>(
                            <div key={r.n} className="res-row"><span>{r.n}</span><span className={`res-val ${r.ok?"rv-ok":"rv-alert"}`}>{r.v}</span></div>
                          ))}
                        </div>
                        <div style={{padding:"10px 13px",background:"rgba(244,167,38,0.07)",border:"1px solid rgba(244,167,38,0.2)",borderRadius:10,fontSize:11,color:"#92400e"}}>
                          ⚠️ Certaines valeurs hors norme. Consultez votre médecin.
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-nav">
                    {[{icon:"📋",label:"Mon RDV",k:"rdv"},{icon:"📍",label:"Suivi",k:"suivi"},{icon:"🧬",label:"Résultats",k:"resultats"},{icon:"👤",label:"Profil",k:null}].map(n=>(
                      <div key={n.label} className={`pn-item ${patTab===n.k?"active":""}`} onClick={()=>n.k&&setPatTab(n.k)}>
                        <span className="pn-icon">{n.icon}</span>
                        <span className="pn-lbl">{n.label}</span>
                        {patTab===n.k&&<div className="pn-dot"/>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="phone-label">📱 App Patient</div>
              <div className="phone-sub">Upload bulletin · OCR · Suivi · Paiement sur place</div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ APP AGENT ════════════════════ */}
      {view==="agent"&&(
        <div className="mobile-wrapper">
          <div className="mobile-scene">
            <div>
              <div className="phone-frame">
                <div className="phone-notch"/>
                <div className="a-app">
                  <div className="a-header">
                    <div className="a-toprow">
                      <div><div className="a-greeting">18 mars 2026</div><div className="a-name">Kouassi Bernard</div></div>
                      <div className="a-status-badge"><div className="a-sdot"/><span className="a-stext">En service</span></div>
                    </div>
                    <div className="a-stats">
                      <div className="a-stat"><div className="as-val" style={{color:"#F4A726"}}>{missions.filter(m=>m.status!=="done").length}</div><div className="as-lbl">À faire</div></div>
                      <div className="a-stat"><div className="as-val" style={{color:"#2CB67D"}}>{missions.filter(m=>m.status==="done").length}</div><div className="as-lbl">Terminés</div></div>
                      <div className="a-stat"><div className="as-val" style={{color:"#60A5FA",fontSize:13}}>{revenus.toLocaleString()}</div><div className="as-lbl">XOF today</div></div>
                    </div>
                  </div>
                  <div className="a-tabs">
                    {[["missions","🗺️ Tournée"],["revenus","💰 Revenus"],["materiel","🧪 Matériel"]].map(([k,l])=>(
                      <div key={k} className={`a-tab ${agentTab===k?"active":""}`} onClick={()=>setAgentTab(k)}>{l}</div>
                    ))}
                  </div>

                  <div className="a-content">

                    {/* ── TOURNÉE ── */}
                    {agentTab==="missions"&&(
                      <>
                        {MATERIEL.some(m=>m.qty<=m.low)&&(
                          <div className="a-alert-card"><span className="aac-icon">⚠️</span><div><div className="aac-text">Stock critique</div><div className="aac-sub">Aiguilles & tubes citrate</div></div></div>
                        )}
                        {missingExamens.length>0&&(
                          <div className="a-alert-card" style={{background:"rgba(244,167,38,0.07)",borderColor:"rgba(244,167,38,0.2)"}}>
                            <span className="aac-icon">📋</span>
                            <div>
                              <div style={{fontSize:12,color:"#F4A726",fontWeight:600}}>Examens à saisir</div>
                              <div style={{fontSize:10,color:"rgba(244,167,38,0.65)"}}>{missingExamens.length} mission(s) sans examens définis</div>
                            </div>
                          </div>
                        )}
                        <div className="sec-hd"><div className="sec-hd-title">Prélèvements du jour</div><div className="sec-hd-badge">{missions.length} missions</div></div>

                        {missions.map(m=>(
                          <div key={m.id} className={`mission-card ${m.status==="active"?"mc-active":m.priority==="urgent"&&m.status!=="done"?"mc-urgent":m.status==="done"?"mc-done":""}`}>
                            <div className="mc-top">
                              <div>
                                <div className="mc-num">{m.id} · {m.heure}</div>
                                <div className="mc-patient">{m.patient}</div>
                                <div className="mc-addr">📍 {m.addr}</div>
                              </div>
                              <span className={`mc-pri ${m.status==="done"?"mcp-done":m.priority==="urgent"?"mcp-urgent":"mcp-normal"}`}>{m.status==="done"?"✓ Fait":m.priority==="urgent"?"⚡ Urgent":"Normal"}</span>
                            </div>

                            {/* Examens avec badge source */}
                            {m.examens.length>0?(
                              <div>
                                {m.ocr_source&&(
                                  <div style={{marginBottom:5}}>
                                    {m.ocr_source==="auto"&&<span className="ocr-badge">🤖 OCR auto · {m.examens.length} examens détectés</span>}
                                    {m.ocr_source==="manual"&&<span className="ocr-badge" style={{background:"rgba(59,130,246,0.1)",borderColor:"rgba(59,130,246,0.2)",color:"#60A5FA"}}>✋ Sélectionné par patient</span>}
                                    {m.ocr_source==="agent"&&<span className="ocr-badge" style={{background:"rgba(244,167,38,0.1)",borderColor:"rgba(244,167,38,0.2)",color:"#F4A726"}}>🏍️ Saisi par l'agent</span>}
                                  </div>
                                )}
                                <div className="mc-tags">
                                  {m.examens.map(e=>(
                                    <span key={e} className={`mc-tag ${m.ocr_source==="auto"?"ocr-tag":m.ocr_source==="manual"?"manual-tag":"agent-tag"}`}>{e}</span>
                                  ))}
                                </div>
                              </div>
                            ):(
                              <div>
                                <span className="missing-badge">⚠️ Examens non définis — à saisir avant prélèvement</span>
                                {m.status!=="done"&&(
                                  <div>
                                    <div style={{fontSize:10,color:"#4B5563",marginBottom:6}}>Sélectionnez les examens :</div>
                                    <div className="a-exam-grid">
                                      {EXAMENS_CATALOGUE.slice(0,12).map(e=>(
                                        <div key={e}
                                          className={`a-exam-chip ${agentExamens.includes(e)?"sel":"unsel"}`}
                                          onClick={()=>setAgentExamens(prev=>prev.includes(e)?prev.filter(x=>x!==e):[...prev,e])}>
                                          {e}
                                        </div>
                                      ))}
                                    </div>
                                    {agentExamens.length>0&&(
                                      <button className="mc-btn mcb-start" style={{marginTop:8,width:"100%"}}
                                        onClick={()=>{
                                          setMissions(prev=>prev.map(x=>x.id===m.id?{...x,examens:agentExamens,ocr_source:"agent"}:x));
                                          setAgentExamens([]);
                                          showToast(`${agentExamens.length} examens saisis pour ${m.patient}`,"📋");
                                        }}>
                                        ✅ Confirmer {agentExamens.length} examen(s)
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Assurance status */}
                            {m.assurance&&(
                              <div style={{marginTop:7,padding:"6px 9px",borderRadius:8,background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.15)"}}>
                                <div style={{fontSize:10,fontWeight:700,color:"#60A5FA"}}>
                                  🛡️ {m.assurance} · {m.assur_status==="valide_partiel"?"⚠️ Validation partielle — encaisser part client":m.assur_status==="valide_total"?"✅ Couverture totale validée":"⏳ En cours de validation"}
                                </div>
                              </div>
                            )}

                            <div className="mc-foot">
                              <div className="mc-time">🕐 {m.heure}{m.status==="active"&&<span style={{color:"#F4A726",marginLeft:5}}>· En cours</span>}</div>
                              <div style={{display:"flex",gap:5}}>
                                {m.status!=="done"&&<button className="mc-btn mcb-gps">🗺️ GPS</button>}
                                {m.status==="waiting"&&m.examens.length>0&&<button className="mc-btn mcb-start" onClick={()=>setMissions(prev=>prev.map(x=>x.id===m.id?{...x,status:"active"}:x))}>▶ Démarrer</button>}
                                {m.status==="active"&&(
                                  <button className="mc-btn mcb-pay"
                                    onClick={()=>{setActiveMission(m);setAgentPayMethod(null);setModal("agent_payment");}}>
                                    💳 Prélèvement fait · Encaisser
                                  </button>
                                )}
                                {m.status==="done"&&<span className="mc-btn mcb-done">✅ Payé</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* ── REVENUS ── */}
                    {agentTab==="revenus"&&(
                      <>
                        <div className="rev-card">
                          <div className="rev-label">Revenus aujourd'hui</div>
                          <div className="rev-amount"><span>{revenus.toLocaleString()}</span> XOF</div>
                          <div className="rev-sub">↑ Mis à jour après chaque encaissement · {missions.filter(m=>m.status==="done").length} prélèvements</div>
                          <div className="rev-bar-wrap">
                            <div className="rev-bar-head"><span>Objectif journalier</span><span>{Math.round(revenus/60000*100)}%</span></div>
                            <div className="rev-bar-track"><div className="rev-bar-fill" style={{width:`${Math.min(revenus/60000*100,100)}%`}}/></div>
                          </div>
                        </div>
                        {[{n:"Koné Aminata",e:"NFS, Glycémie, Bilip",m:9000,h:"09:38",mode:"Orange Money"},{n:"Yao Bernadette",e:"TSH, T4 libre",m:3600,h:"07:20",mode:"Wave"},{n:"Diallo Ibrahim",e:"Bilan rénal, ECBU",m:17500,h:"07:00",mode:"Cash"}].map((r,i)=>(
                          <div key={i} className="rev-row">
                            <div><div className="rr-name">{r.n}</div><div className="rr-sub">{r.e} · {r.h} · {r.mode}</div></div>
                            <div><div className="rr-amount">+{r.m.toLocaleString()}</div><div style={{fontSize:9,color:"#4B5563",textAlign:"right"}}>XOF</div></div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* ── MATÉRIEL ── */}
                    {agentTab==="materiel"&&(
                      <>
                        <div className="sec-hd">
                          <div className="sec-hd-title">Stock temps réel</div>
                          <div className="sec-hd-badge" style={{background:"rgba(224,92,92,0.1)",color:"#E05C5C"}}>{MATERIEL.filter(m=>m.qty<=m.low).length} alerte(s)</div>
                        </div>
                        {MATERIEL.filter(m=>m.qty<=m.low).length>0&&(
                          <div className="a-alert-card"><span className="aac-icon">🚨</span><div><div className="aac-text">Réapprovisionnement nécessaire</div><div className="aac-sub">{MATERIEL.filter(m=>m.qty<=m.low).map(m=>m.name).join(", ")}</div></div></div>
                        )}
                        <div className="mat-grid">
                          {MATERIEL.map(m=>{
                            const pct=Math.round(m.qty/m.max*100);
                            const cls=m.qty<=2?"crit":m.qty<=m.low?"low":"ok";
                            const col=cls==="crit"?C.danger:cls==="low"?C.orange:C.success;
                            return(
                              <div key={m.name} className="mat-card">
                                <div className="mat-icon">{m.icon}</div>
                                <div className="mat-name">{m.name}</div>
                                <div className={`mat-qty mq-${cls}`}>{m.qty}<span style={{fontSize:11,opacity:0.5,fontWeight:400}}>/{m.max}</span></div>
                                <div className="mat-unit">{m.unit}</div>
                                <div className="mat-bar-t"><div className="mat-bar-f" style={{width:`${pct}%`,background:col}}/></div>
                                {cls!=="ok"&&<div className="mat-alert">{cls==="crit"?"🚨 Rupture":"⚠️ Bas"}</div>}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{background:"#161B22",borderRadius:12,padding:12,border:"1px solid rgba(255,255,255,0.04)"}}>
                          <button style={{width:"100%",padding:"9px",background:"#0A6E5C",border:"none",borderRadius:9,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                            📦 Demander réapprovisionnement
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="a-nav">
                    {[{icon:"🗺️",label:"Tournée",k:"missions"},{icon:"💰",label:"Revenus",k:"revenus"},{icon:"🧪",label:"Matériel",k:"materiel",alert:MATERIEL.filter(m=>m.qty<=m.low).length},{icon:"👤",label:"Profil",k:null}].map(n=>(
                      <div key={n.label} className={`an-item ${agentTab===n.k?"active":""}`} onClick={()=>n.k&&setAgentTab(n.k)}>
                        <div className="notif-wrap"><span className="an-icon">{n.icon}</span>{n.alert>0&&<div className="notif-badge">{n.alert}</div>}</div>
                        <span className="an-lbl">{n.label}</span>
                        {agentTab===n.k&&<div className="an-dot"/>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="phone-label">📱 App Agent</div>
              <div className="phone-sub">OCR · Examens avant visite · Encaissement sur place</div>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL NOUVEAU PATIENT (web) ════ */}
      {modal==="new_patient"&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div><div className="modal-title">🧬 Nouveau dossier patient</div><div className="modal-sub">Upload bulletin + OCR automatique</div></div>
              <button className="modal-close" onClick={()=>setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group span2"><label className="form-label">Nom complet *</label><input className="form-input" placeholder="Ex: Koné Aminata" value={form.nom||""} onChange={e=>setForm(f=>({...f,nom:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Date de naissance</label><input className="form-input" type="date" value={form.dob||""} onChange={e=>setForm(f=>({...f,dob:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" placeholder="+225 07 XX XX XX" value={form.tel||""} onChange={e=>setForm(f=>({...f,tel:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Commune</label><select className="form-select" value={form.commune||"Yopougon"} onChange={e=>setForm(f=>({...f,commune:e.target.value}))}>{["Yopougon","Attécoubé","Cocody","Adjamé","Marcory","Abobo","Koumassi","Treichville","Port-Bouët"].map(c=><option key={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Assurance</label><select className="form-select" value={form.assurance||""} onChange={e=>setForm(f=>({...f,assurance:e.target.value||null}))}><option value="">Sans assurance</option>{["MUGEFCI","CNPS","Sanlam CI","NSIA Santé","Allianz CI"].map(a=><option key={a}>{a}</option>)}</select></div>
                {form.assurance&&<div className="form-group"><label className="form-label">N° carte assurance</label><input className="form-input" placeholder="Ex: MUG-2024-XXXX" value={form.num_carte||""} onChange={e=>setForm(f=>({...f,num_carte:e.target.value}))}/></div>}

                <div className="form-divider">Documents à uploader</div>

                {/* Upload bulletin */}
                <div className="form-group span2">
                  <label className="form-label">📄 Bulletin d'analyses *</label>
                  <div className={`upload-zone ${uploadedDocs.bulletin||ocrStep!=="idle"?"has-file":""}`} onClick={()=>!uploadedDocs.bulletin&&handleBulletinUpload()}>
                    {ocrStep==="idle"&&!uploadedDocs.bulletin&&<div style={{textAlign:"center"}}><div style={{fontSize:24,marginBottom:4}}>📷</div><div style={{fontSize:13,fontWeight:600,color:C.text}}>Cliquer pour uploader le bulletin</div><div style={{fontSize:11,color:C.textLight}}>Photo ou PDF · L'OCR extraira automatiquement les examens</div></div>}
                    {(ocrStep==="uploading"||ocrStep==="scanning")&&(
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div className="ocr-spinner"/>
                        <div><div style={{fontSize:13,fontWeight:600,color:C.info}}>{ocrStep==="uploading"?"Envoi en cours...":"🤖 Analyse OCR en cours..."}</div><div style={{fontSize:11,color:C.textLight}}>{ocrStep==="scanning"?"Extraction des examens du bulletin":""}</div></div>
                      </div>
                    )}
                    {ocrStep==="done"&&<div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>✅</span><div><div style={{fontSize:13,fontWeight:600,color:C.success}}>bulletin_analyses.jpg · OCR terminé</div><div style={{fontSize:11,color:C.textLight}}>{ocrExamens.length} examens détectés automatiquement</div></div></div>}
                  </div>
                </div>

                {/* Résultat OCR */}
                {ocrStep==="done"&&(
                  <div className="form-group span2">
                    <label className="form-label">🤖 Examens détectés par OCR</label>
                    <div style={{background:"rgba(44,182,125,0.06)",border:"1px solid rgba(44,182,125,0.2)",borderRadius:10,padding:14}}>
                      <div style={{fontSize:12,color:C.success,fontWeight:700,marginBottom:8}}>✅ {ocrExamens.length} examen(s) reconnu(s) automatiquement :</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                        {ocrExamens.map(e=>(
                          <span key={e}
                            className={`exam-chip ocr-detected ${selectedExamens.includes(e)?"selected":""}`}
                            onClick={()=>toggleExamen(e)}>
                            {selectedExamens.includes(e)?"✓ ":""}{e}
                          </span>
                        ))}
                      </div>
                      <div style={{fontSize:11,color:C.textLight}}>Cliquez pour désélectionner un examen incorrect. Ajoutez-en d'autres ci-dessous.</div>
                    </div>
                  </div>
                )}

                {/* Sélection manuelle */}
                <div className="form-group span2">
                  <label className="form-label">{ocrStep==="done"?"➕ Ajouter des examens manuellement":"✋ Sélection manuelle des examens"}</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:12,background:C.bg,borderRadius:9,border:`1.5px solid ${C.border}`,maxHeight:140,overflowY:"auto"}}>
                    {EXAMENS_CATALOGUE.filter(e=>!ocrExamens.includes(e)).map(e=>(
                      <span key={e}
                        className={`exam-chip manual ${selectedExamens.includes(e)?"selected":""}`}
                        onClick={()=>toggleExamen(e,true)}>
                        {selectedExamens.includes(e)?"✓ ":""}{e}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedExamens.length>0&&(
                  <div className="form-group span2">
                    <div className="info-teal info-banner" style={{margin:0}}>
                      ✅ <strong>{selectedExamens.length} examen(s) confirmé(s)</strong> : {selectedExamens.join(", ")} — L'agent les verra avant d'arriver au domicile.
                    </div>
                  </div>
                )}

                {/* Upload autres docs */}
                <div className="form-divider">Autres documents</div>
                {form.assurance&&(
                  <div className="form-group">
                    <label className="form-label">🛡️ Carte d'assurance</label>
                    <div className={`upload-zone ${uploadedDocs.assurance_card?"has-file":""}`} style={{padding:12}} onClick={()=>setUploadedDocs(d=>({...d,assurance_card:true}))}>
                      {uploadedDocs.assurance_card?<div style={{fontSize:12,color:C.success,fontWeight:600}}>✅ carte_assurance.jpg</div>:<div style={{fontSize:12,color:C.textLight}}>📷 Uploader la carte {form.assurance}</div>}
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">🪪 Pièce d'identité</label>
                  <div className={`upload-zone ${uploadedDocs.cni?"has-file":""}`} style={{padding:12}} onClick={()=>setUploadedDocs(d=>({...d,cni:true}))}>
                    {uploadedDocs.cni?<div style={{fontSize:12,color:C.success,fontWeight:600}}>✅ cni.jpg</div>:<div style={{fontSize:12,color:C.textLight}}>📷 Uploader la CNI</div>}
                  </div>
                </div>

                {form.assurance&&selectedExamens.length>0&&uploadedDocs.bulletin&&uploadedDocs.assurance_card&&(
                  <div className="form-group span2">
                    <div className="info-blue info-banner" style={{margin:0}}>
                      🚀 <strong>Dossier complet !</strong> Documents + examens disponibles. Le dossier assurance {form.assurance} sera transmis au Labo Maison Blanche immédiatement — la validation peut être obtenue avant la visite de l'agent.
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={submitNewPatient}>✅ Créer le dossier</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL PAIEMENT AGENT (sur place) ════ */}
      {modal==="agent_payment"&&activeMission&&(()=>{
        const m=activeMission;
        const p=patients.find(x=>x.id===m.patientId);
        const t=p?calcT(p):{total:15000,pa:0,nc:0,qpc:0,partPatient:15000};
        return(
          <div className="modal-overlay" onClick={()=>setModal(null)}>
            <div className="a-pay-modal" onClick={e=>e.stopPropagation()}>
              <div className="a-pay-header">
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"#F9FAFB"}}>💳 Encaissement — {m.patient}</div>
                  <div style={{fontSize:11,color:"#4B5563",marginTop:2}}>{m.id} · Paiement après prélèvement</div>
                </div>
                <button style={{background:"rgba(255,255,255,0.06)",border:"none",borderRadius:7,width:28,height:28,color:"#4B5563",cursor:"pointer",fontSize:14}} onClick={()=>setModal(null)}>✕</button>
              </div>
              <div style={{padding:18}}>
                {/* Détail examens */}
                {p&&p.examens.map(e=>(
                  <div key={e.nom} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",fontSize:12,borderBottom:"1px solid rgba(255,255,255,0.06)",color:"#D1FAE5"}}>
                    <span style={{color:"#F9FAFB",display:"flex",alignItems:"center",gap:6}}>
                      {e.nom}
                      {e.couvert===true&&<span style={{fontSize:10,background:"rgba(44,182,125,0.12)",color:"#2CB67D",padding:"1px 6px",borderRadius:8,fontWeight:700}}>assurance</span>}
                      {e.couvert===false&&<span style={{fontSize:10,background:"rgba(224,92,92,0.12)",color:"#E05C5C",padding:"1px 6px",borderRadius:8,fontWeight:700}}>non couvert</span>}
                    </span>
                    <span style={{fontWeight:700}}>
                      {e.couvert===true
                        ?<><span style={{color:"#4B5563",textDecoration:"line-through",fontSize:11,marginRight:5}}>{e.tarif.toLocaleString()}</span>{(e.tarif*0.2).toLocaleString()} XOF</>
                        :`${e.tarif.toLocaleString()} XOF`}
                    </span>
                  </div>
                ))}

                {/* Récap */}
                <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:12,marginTop:10}}>
                  {t.pa>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}><span style={{color:"#2CB67D"}}>✅ Assurance {m.assurance}</span><span style={{color:"#2CB67D",fontWeight:700}}>— {t.pa.toLocaleString()} XOF</span></div>}
                  {t.nc>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}><span style={{color:"#E05C5C"}}>Non couvert</span><span style={{color:"#E05C5C",fontWeight:700}}>{t.nc.toLocaleString()} XOF</span></div>}
                  <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:10,marginTop:5}}>
                    <span style={{color:"#F9FAFB",fontSize:14,fontWeight:700}}>À encaisser</span>
                    <span style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:"#F4A726"}}>{t.partPatient.toLocaleString()} XOF</span>
                  </div>
                </div>

                {/* Mode de paiement */}
                <div style={{marginTop:14,marginBottom:8,fontSize:11,color:"#4B5563",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px"}}>Mode de paiement</div>
                {[{id:"cash",icon:"💵",name:"Espèces",detail:"Paiement immédiat"},{id:"orange",icon:"🟠",name:"Orange Money",detail:"*144*1#"},{id:"mtn",icon:"🟡",name:"MTN MoMo",detail:"*133#"},{id:"wave",icon:"🌊",name:"Wave",detail:"Scan QR"}].map(pm=>(
                  <div key={pm.id} className={`a-pay-pm ${agentPayMethod===pm.id?"selected":""}`} onClick={()=>setAgentPayMethod(pm.id)}>
                    <span style={{fontSize:20}}>{pm.icon}</span>
                    <div><div style={{fontSize:12,fontWeight:600,color:"#F9FAFB"}}>{pm.name}</div><div style={{fontSize:10,color:"#4B5563"}}>{pm.detail}</div></div>
                    {agentPayMethod===pm.id&&<span style={{marginLeft:"auto",fontSize:14,color:"#2CB67D"}}>✓</span>}
                  </div>
                ))}

                <button
                  disabled={!agentPayMethod}
                  style={{width:"100%",marginTop:10,padding:"12px",background:agentPayMethod?"#F4A726":"rgba(255,255,255,0.06)",border:"none",borderRadius:10,color:agentPayMethod?"#064D40":"#4B5563",fontSize:14,fontWeight:800,cursor:agentPayMethod?"pointer":"not-allowed",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.18s"}}
                  onClick={()=>confirmAgentPay(m.id)}>
                  ✅ Confirmer {t.partPatient.toLocaleString()} XOF encaissé
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════ MODAL DÉTAIL ASSURANCE (web) ════ */}
      {modal==="assurance"&&activeP&&(()=>{
        const p=patients.find(x=>x.id===activeP.id)||activeP;const t=calcT(p);
        const si=["docs_collectes","soumis_labo","en_validation","valide_total"].indexOf(p.statut_assurance);
        return(
          <div className="modal-overlay" onClick={()=>setModal(null)}>
            <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <div><div className="modal-title">🛡️ Suivi assurance — {p.nom}</div><div className="modal-sub">{p.id} · {p.prescription} · {p.assurance}</div></div>
                <button className="modal-close" onClick={()=>setModal(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="steps-bar">
                  {["📄 Docs uploadés","🏥 Labo","⏳ Portail","✅ Validation"].map((l,i)=>(
                    <div key={i} className={`step-item ${si>i?"done":si===i?"active":""}`}>
                      <div className="step-dot">{si>i?"✓":i+1}</div><div className="step-label">{l}</div>
                    </div>
                  ))}
                </div>
                <div className="info-teal info-banner">
                  💡 Documents uploadés par le patient lors de la prise de RDV — soumission possible <strong>avant la visite de l'agent</strong>.
                </div>
                {p.statut_assurance==="docs_collectes"&&<div className="info-blue info-banner">📄 Documents reçus via l'app patient. <strong>Action :</strong> Transmettre au Laboratoire Maison Blanche.</div>}
                {p.statut_assurance==="soumis_labo"&&<div className="info-orange info-banner">🏥 Transmis au labo. <strong>Action :</strong> Confirmer soumission portail {p.assurance}.</div>}
                {p.statut_assurance==="en_validation"&&<div className="info-yellow info-banner">⏳ En attente décision <strong>{p.assurance}</strong>.</div>}
                {p.statut_assurance==="valide_total"&&<div className="info-green info-banner">✅ Tous les examens couverts.</div>}
                {p.statut_assurance==="valide_partiel"&&<div className="info-orange info-banner">⚠️ Validation partielle — examens non couverts à la charge du client.</div>}

                {/* Documents */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.textLight,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Documents uploadés par le patient</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    {[{k:"bulletin",icon:"📄",label:"Bulletin"},{k:"assurance_card",icon:"🛡️",label:"Carte assur."},{k:"cni",icon:"🪪",label:"CNI"}].map(d=>(
                      <div key={d.k} style={{padding:"10px 12px",borderRadius:9,textAlign:"center",background:p.docs[d.k]?"rgba(44,182,125,0.06)":"rgba(224,92,92,0.04)",border:`1px solid ${p.docs[d.k]?"rgba(44,182,125,0.25)":"rgba(224,92,92,0.2)"}`}}>
                        <div style={{fontSize:22,marginBottom:4}}>{d.icon}</div>
                        <div style={{fontSize:12,fontWeight:700,color:p.docs[d.k]?C.success:C.danger}}>{d.label}</div>
                        <div style={{fontSize:10,color:p.docs[d.k]?C.success:C.danger}}>{p.docs[d.k]?"✓ Reçu":"Manquant"}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Examens */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.textLight,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>
                    Examens — Source : {OCR_SRC[p.ocr_source]?.icon} {OCR_SRC[p.ocr_source]?.label}
                  </div>
                  {p.examens.map(e=>(
                    <div key={e.nom} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,border:`1.5px solid ${e.couvert===true?C.success:e.couvert===false?C.danger:C.border}`,background:e.couvert===true?"rgba(44,182,125,0.04)":e.couvert===false?"rgba(224,92,92,0.04)":C.bg,marginBottom:6}}>
                      <div style={{flex:1}}><span style={{fontWeight:600,fontSize:13}}>{e.nom}</span><span style={{fontSize:12,color:C.textLight,marginLeft:7}}>{e.tarif.toLocaleString()} XOF</span></div>
                      {e.couvert===true&&<span className="badge b-success">✅ Couvert ({(e.tarif*0.8).toLocaleString()} XOF)</span>}
                      {e.couvert===false&&<span className="badge b-danger">❌ Non couvert — client {e.tarif.toLocaleString()} XOF</span>}
                      {e.couvert===null&&<span className="badge b-neutral">En attente</span>}
                    </div>
                  ))}
                </div>

                {(p.statut_assurance==="valide_total"||p.statut_assurance==="valide_partiel")&&(
                  <div className="summary-box">
                    <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>💰 Récapitulatif financier · Paiement sur place par l'agent</div>
                    <div className="summary-row"><span>Total examens</span><span>{t.total.toLocaleString()} XOF</span></div>
                    {t.pa>0&&<div className="summary-row"><span style={{color:C.success}}>Prise en charge {p.assurance} (80%)</span><span style={{color:C.success}}>— {t.pa.toLocaleString()} XOF</span></div>}
                    {t.nc>0&&<div className="summary-row"><span style={{color:C.danger}}>Examens non couverts</span><span style={{color:C.danger}}>{t.nc.toLocaleString()} XOF</span></div>}
                    {t.qpc>0&&<div className="summary-row"><span style={{color:C.orange}}>Quote-part (20%)</span><span style={{color:C.orange}}>{t.qpc.toLocaleString()} XOF</span></div>}
                    <div className="summary-row total"><span>🧾 ENCAISSÉ PAR L'AGENT SUR PLACE</span><span style={{color:C.primary,fontSize:17}}>{t.partPatient.toLocaleString()} XOF</span></div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={()=>setModal(null)}>Fermer</button>
                {p.statut_assurance==="docs_collectes"&&<button className="btn btn-primary" onClick={()=>{advanceAssur(p.id,"soumis_labo");setModal(null);showToast("Envoyé au labo","🏥");}}>🏥 Marquer envoyé au labo</button>}
                {p.statut_assurance==="soumis_labo"&&<button className="btn btn-orange" onClick={()=>{advanceAssur(p.id,"en_validation");setModal(null);showToast("Soumission portail confirmée","⏳");}}>⏳ Confirmer soumission portail</button>}
                {p.statut_assurance==="en_validation"&&<button className="btn btn-accent" onClick={()=>{setValForm({});setModal("validation");}}>📋 Saisir résultat</button>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════ MODAL SAISIE VALIDATION (web) ════ */}
      {modal==="validation"&&activeP&&(()=>{
        const p=patients.find(x=>x.id===activeP.id)||activeP;
        const all=p.examens.every(e=>valForm[e.nom]!==undefined);
        const prev=all?p.examens.map(e=>({...e,couvert:valForm[e.nom]})):null;
        const t=prev?calcT({...p,examens:prev}):null;
        const isTotal=prev&&prev.every(e=>e.couvert===true);
        return(
          <div className="modal-overlay" onClick={()=>setModal(null)}>
            <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <div><div className="modal-title">📋 Résultat validation — {p.assurance}</div><div className="modal-sub">Patient : {p.nom} · {p.prescription}</div></div>
                <button className="modal-close" onClick={()=>setModal(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="info-blue info-banner">Décision reçue de <strong>{p.assurance}</strong> via Labo Maison Blanche. Cochez chaque examen.</div>
                {p.examens.map(e=>(
                  <div key={e.nom} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",borderRadius:9,border:`1.5px solid ${valForm[e.nom]===true?C.success:valForm[e.nom]===false?C.danger:C.border}`,background:valForm[e.nom]===true?"rgba(44,182,125,0.04)":valForm[e.nom]===false?"rgba(224,92,92,0.04)":C.bg,marginBottom:7}}>
                    <div style={{flex:1}}><div style={{fontWeight:600}}>{e.nom}</div><div style={{fontSize:12,color:C.textLight}}>{e.tarif.toLocaleString()} XOF</div></div>
                    <div style={{display:"flex",gap:7}}>
                      <button className={`btn btn-sm ${valForm[e.nom]===true?"btn-success":"btn-outline"}`} onClick={()=>setValForm(f=>({...f,[e.nom]:true}))}>✅ Couvert</button>
                      <button className={`btn btn-sm ${valForm[e.nom]===false?"btn-danger":"btn-outline"}`} onClick={()=>setValForm(f=>({...f,[e.nom]:false}))}>❌ Non couvert</button>
                    </div>
                  </div>
                ))}
                {all&&t&&(
                  <div className="summary-box">
                    <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>{isTotal?"✅ Couverture TOTALE":t.nc>0&&t.cov>0?"⚠️ PARTIELLE":"❌ Aucune couverture"}</div>
                    <div className="summary-row"><span>Total examens</span><span>{t.total.toLocaleString()} XOF</span></div>
                    {t.pa>0&&<div className="summary-row"><span style={{color:C.success}}>Assurance (80%)</span><span style={{color:C.success}}>— {t.pa.toLocaleString()} XOF</span></div>}
                    {t.nc>0&&<div className="summary-row"><span style={{color:C.danger}}>Non couverts → 100% client</span><span style={{color:C.danger}}>{t.nc.toLocaleString()} XOF</span></div>}
                    <div className="summary-row total"><span>Agent encaisse sur place</span><span style={{color:C.primary}}>{t.partPatient.toLocaleString()} XOF</span></div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={()=>setModal(null)}>Annuler</button>
                <button className="btn btn-primary" disabled={!all} onClick={()=>confirmValidation(p.id,isTotal?"valide_total":"valide_partiel",valForm)}>✅ Confirmer et notifier agent</button>
              </div>
            </div>
          </div>
        );
      })()}

      {toast&&<div className="toast"><span>{toast.icon}</span><span>{toast.msg}</span></div>}
    </>
  );
}
