import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, ScanLine, MessageSquare, CreditCard, Bus, Building2,
  AlertTriangle, LayoutDashboard, ShieldCheck, Smartphone,
} from 'lucide-react';

export const dynamic = 'force-static';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Vue d’ensemble en temps réel',
    desc: 'Un seul écran pour voir combien de pèlerins sont inscrits, combien de visas sont approuvés, combien d’argent est encaissé, et qui est à risque avant qu’il ne soit trop tard.',
  },
  {
    icon: Users,
    title: 'Gestion complète des pèlerins',
    desc: 'Fiche par fiche : passeport, visa, vol, hôtel, bus, paiement, contact d’urgence. Recherche, filtres, export en un clic.',
  },
  {
    icon: ScanLine,
    title: 'Scan de passeport automatique',
    desc: 'Prends une photo du passeport, l’app lit la bande MRZ et pré-remplit la fiche du pèlerin. Le staff vérifie et valide.',
  },
  {
    icon: Bus,
    title: 'Auto-assignation bus & hôtel',
    desc: 'Un bouton répartit automatiquement les pèlerins non affectés sur les bus et dans les chambres d’hôtel disponibles, en gardant les groupes ensemble.',
  },
  {
    icon: MessageSquare,
    title: 'Contact WhatsApp direct',
    desc: 'Ouvre WhatsApp avec le bon numéro et un message déjà rédigé pour chaque pèlerin — rappels de paiement, de passeport, de départ.',
  },
  {
    icon: CreditCard,
    title: 'Suivi des paiements',
    desc: 'Qui a payé, combien il reste, qui est en retard. Historique complet des transactions, export CSV.',
  },
  {
    icon: AlertTriangle,
    title: 'Alertes automatiques',
    desc: 'Passeport manquant, visa refusé, paiement en retard, pas de bus assigné : la liste des cas urgents se construit toute seule, à partir des vraies données.',
  },
  {
    icon: ShieldCheck,
    title: 'Accès sécurisé multi-utilisateurs',
    desc: 'Plusieurs membres du staff, chacun avec son propre identifiant, mots de passe protégés — personne d’autre ne peut voir les données.',
  },
];

const screenshots = [
  { src: '/showcase/dashboard.png', alt: 'Tableau de bord de la campagne', label: 'Tableau de bord' },
  { src: '/showcase/pilgrim-management.png', alt: 'Gestion des pèlerins', label: 'Gestion des pèlerins' },
  { src: '/showcase/payments.png', alt: 'Suivi des paiements', label: 'Paiements' },
  { src: '/showcase/group-leader.png', alt: 'Tableau de bord du chef de groupe', label: 'Chefs de groupe' },
  { src: '/showcase/allocation.png', alt: 'Allocation bus et hôtels', label: 'Bus & hôtels' },
  { src: '/showcase/login.png', alt: 'Page de connexion sécurisée', label: 'Connexion sécurisée' },
];

export default function ShowcasePage() {
  return (
    <div style={{ background: '#F7F5F2', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ padding: '72px 24px 56px', textAlign: 'center', maxWidth: 780, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: '#EDE9E3', color: '#6B6560', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
          <Smartphone size={14} />
          Logiciel de gestion Hajj &amp; Omra
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: '#1F1B16', margin: '0 0 16px', lineHeight: 1.15 }}>
          ManasikPro
        </h1>
        <p style={{ fontSize: 18, color: '#4A443C', lineHeight: 1.6, margin: '0 0 32px' }}>
          Toute la logistique d’une campagne Hajj ou Omra — pèlerins, visas, passeports, paiements, bus, hôtels
          et vols — pilotée depuis un seul tableau de bord. Fini les fichiers Excel éparpillés et les messages
          WhatsApp perdus.
        </p>
        <Link
          href="/login"
          style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: '#1B6B4A', color: 'white', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}
        >
          Se connecter au tableau de bord
        </Link>
      </section>

      {/* Screenshots */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {screenshots.map((s) => (
            <figure key={s.src} style={{ margin: 0, background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E1DA', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <Image src={s.src} alt={s.alt} width={1440} height={900} style={{ width: '100%', height: 'auto', display: 'block' }} />
              <figcaption style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#4A443C' }}>{s.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* What it's for / pitch */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 64px' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1F1B16', textAlign: 'center', margin: '0 0 12px' }}>
          À quoi ça sert ?
        </h2>
        <p style={{ fontSize: 15, color: '#4A443C', lineHeight: 1.7, textAlign: 'center', maxWidth: 680, margin: '0 auto 40px' }}>
          Organiser un Hajj ou une Omra pour des centaines de personnes veut dire suivre en parallèle des dizaines
          de statuts par pèlerin — passeport, visa, vol, chambre, bus, paiement — sans qu’un seul ne passe entre les
          mailles du filet. ManasikPro remplace les fichiers Excel, les groupes WhatsApp et les carnets papier par
          un seul système que toute l’équipe utilise en même temps, avec les mêmes informations à jour pour tout le
          monde.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} style={{ background: 'white', border: '1px solid #E5E1DA', borderRadius: 14, padding: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EAF3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={18} color="#1B6B4A" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1F1B16', margin: '0 0 6px' }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: '#6B6560', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ textAlign: 'center', padding: '0 24px 72px' }}>
        <Link
          href="/login"
          style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: '#1B6B4A', color: 'white', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}
        >
          Accéder à l’application
        </Link>
      </section>
    </div>
  );
}
