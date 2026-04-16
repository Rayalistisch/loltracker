import { cn } from "@/lib/utils"
import {
  Eye, Swords, TrendingUp, AlertTriangle, Info,
  CheckCircle2, XCircle, Target, Zap, Brain, Shield,
} from "lucide-react"
import type { PreGameCheckin, PostGameReflection } from "@/types/domain"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Game {
  id: string
  result: "win" | "loss"
  champion: string | null
  kills: number | null
  deaths: number | null
  assists: number | null
  cs: number | null
  duration: number | null
  vision_score: number | null
  wards_placed: number | null
  wards_killed: number | null
  control_wards: number | null
  cc_score: number | null
  damage_to_champs: number | null
  heal_shield: number | null
  gold_earned: number | null
}

interface SessionInsightsProps {
  games: Game[]
  role: string | undefined
  checkin: PreGameCheckin | null
  reflection: PostGameReflection | null
}

// ─── Champion archetype database ──────────────────────────────────────────────

type Archetype =
  | "ENGAGE_SUPPORT" | "HEALER_SUPPORT" | "POKE_SUPPORT"
  | "CARRY_ADC"      | "POKE_ADC"
  | "ASSASSIN_MID"   | "MAGE_MID"
  | "BRUISER_TOP"    | "TANK_TOP"
  | "SKIRMISH_JG"    | "TANK_JG"

interface ArchetypeInfo {
  label: string
  playstyle: string
  winCondition: string
  keyStats: string[]
  alternatives?: string[]
}

const ARCHETYPE_INFO: Record<Archetype, ArchetypeInfo> = {
  ENGAGE_SUPPORT:  { label: "Engage Support",  playstyle: "Aggressief, hard engage, CC-chains",   winCondition: "Pak carries vast, maak picks",     keyStats: ["CC score", "Vision"],               alternatives: ["Leona","Nautilus","Thresh"]  },
  HEALER_SUPPORT:  { label: "Enchanter",        playstyle: "Beschermend, shields, peeling",        winCondition: "Houd je carry levend in fights",   keyStats: ["Heal+Shield", "Vision"],            alternatives: ["Lulu","Soraka","Nami"]       },
  POKE_SUPPORT:    { label: "Poke Support",     playstyle: "Afstand poken, zone control",          winCondition: "Verlies lane via HP-voordeel",     keyStats: ["Damage", "Vision"],                 alternatives: ["Lux","Zyra","Morgana"]       },
  CARRY_ADC:       { label: "Hypercarry ADC",   playstyle: "Farm-first, late-game teamfight carry", winCondition: "Schaal naar items, clean-up fights", keyStats: ["CS/min", "Damage"],               alternatives: ["Jinx","Kaisa","Tristana"]    },
  POKE_ADC:        { label: "Poke ADC",         playstyle: "Drukken via range poke, kite",         winCondition: "Bully lane, outrange vijand",      keyStats: ["CS/min", "Damage"],                 alternatives: ["Caitlyn","Ezreal","Jhin"]    },
  ASSASSIN_MID:    { label: "Assassin",         playstyle: "Burst carries, roam voor picks",       winCondition: "Snowball early, one-shot threats",  keyStats: ["Kills", "Deaths"],                  alternatives: ["Zed","Talon","LeBlanc"]      },
  MAGE_MID:        { label: "Mage",             playstyle: "CS + scale, teamfight damage",         winCondition: "Farm lead → teamfight dominance",  keyStats: ["CS/min", "Damage"],                 alternatives: ["Ahri","Viktor","Syndra"]     },
  BRUISER_TOP:     { label: "Bruiser/Carry Top",playstyle: "Lane dominant, split-push of teamfight", winCondition: "Win lane 1v1, teleport voor impact", keyStats: ["CS/min", "Damage"],              alternatives: ["Darius","Camille","Irelia"]  },
  TANK_TOP:        { label: "Tank Top",         playstyle: "Frontlane, peel, engage",              winCondition: "Absorb damage, engage voor team",  keyStats: ["Deaths", "CC score"],               alternatives: ["Malphite","Ornn","Sion"]     },
  SKIRMISH_JG:     { label: "Skirmish Jungler", playstyle: "Early pressure, dueling, picks",       winCondition: "Domineer river, starve vijand",    keyStats: ["CS/min", "Deaths"],                 alternatives: ["LeeSin","Graves","Khazix"]   },
  TANK_JG:         { label: "Engage Jungler",   playstyle: "Teamfight engage, peel, CC",           winCondition: "Engage goed getimede teamfights",  keyStats: ["CC score", "Deaths"],               alternatives: ["Vi","Amumu","Hecarim"]       },
}

const CHAMPION_ARCHETYPE: Record<string, Archetype> = {
  // Engage supports
  Thresh: "ENGAGE_SUPPORT", Blitzcrank: "ENGAGE_SUPPORT", Nautilus: "ENGAGE_SUPPORT",
  Leona: "ENGAGE_SUPPORT", Alistar: "ENGAGE_SUPPORT", Pyke: "ENGAGE_SUPPORT",
  Rakan: "ENGAGE_SUPPORT", Rell: "ENGAGE_SUPPORT", Senna: "ENGAGE_SUPPORT",
  // Enchanter/heal supports
  Soraka: "HEALER_SUPPORT", Lulu: "HEALER_SUPPORT", Nami: "HEALER_SUPPORT",
  Janna: "HEALER_SUPPORT", Sona: "HEALER_SUPPORT", Yuumi: "HEALER_SUPPORT",
  Karma: "HEALER_SUPPORT", Renata: "HEALER_SUPPORT", Milio: "HEALER_SUPPORT",
  // Poke supports
  Lux: "POKE_SUPPORT", Zyra: "POKE_SUPPORT", Morgana: "POKE_SUPPORT",
  Brand: "POKE_SUPPORT", Xerath: "POKE_SUPPORT", Vel: "POKE_SUPPORT",
  // Hypercarry ADCs
  Jinx: "CARRY_ADC", Tristana: "CARRY_ADC", Vayne: "CARRY_ADC",
  KogMaw: "CARRY_ADC", Kaisa: "CARRY_ADC", Draven: "CARRY_ADC",
  Aphelios: "CARRY_ADC", Zeri: "CARRY_ADC",
  // Poke ADCs
  Caitlyn: "POKE_ADC", Ezreal: "POKE_ADC", Lucian: "POKE_ADC",
  Jhin: "POKE_ADC", Ashe: "POKE_ADC", MissFortune: "POKE_ADC",
  Sivir: "POKE_ADC", Xayah: "POKE_ADC",
  // Assassins mid
  Zed: "ASSASSIN_MID", Talon: "ASSASSIN_MID", Akali: "ASSASSIN_MID",
  LeBlanc: "ASSASSIN_MID", Katarina: "ASSASSIN_MID", Fizz: "ASSASSIN_MID",
  Qiyana: "ASSASSIN_MID", Diana: "ASSASSIN_MID",
  // Mages mid
  Ahri: "MAGE_MID", Viktor: "MAGE_MID", Syndra: "MAGE_MID", Orianna: "MAGE_MID",
  Lissandra: "MAGE_MID", Twisted: "MAGE_MID", Veigar: "MAGE_MID",
  Cassiopeia: "MAGE_MID", Zoe: "MAGE_MID", Yone: "MAGE_MID", Yasuo: "MAGE_MID",
  // Bruiser top
  Darius: "BRUISER_TOP", Renekton: "BRUISER_TOP", Camille: "BRUISER_TOP",
  Fiora: "BRUISER_TOP", Irelia: "BRUISER_TOP", Jax: "BRUISER_TOP",
  Tryndamere: "BRUISER_TOP", Olaf: "BRUISER_TOP", Nasus: "BRUISER_TOP",
  Garen: "BRUISER_TOP", Illaoi: "BRUISER_TOP", Mordekaiser: "BRUISER_TOP",
  // Tank top
  Malphite: "TANK_TOP", Ornn: "TANK_TOP", Sion: "TANK_TOP",
  Cho: "TANK_TOP", Volibear: "TANK_TOP", Maokai: "TANK_TOP",
  // Skirmish jg
  LeeSin: "SKIRMISH_JG", Graves: "SKIRMISH_JG", Khazix: "SKIRMISH_JG",
  Rengar: "SKIRMISH_JG", Ekko: "SKIRMISH_JG", Evelynn: "SKIRMISH_JG",
  Nidalee: "SKIRMISH_JG", Kindred: "SKIRMISH_JG", Belveth: "SKIRMISH_JG",
  // Tank jg
  Vi: "TANK_JG", Amumu: "TANK_JG", Hecarim: "TANK_JG",
  Warwick: "TANK_JG", Jarvan: "TANK_JG", Sejuani: "TANK_JG",
  Zac: "TANK_JG", Nunu: "TANK_JG",
}

// ─── Aggregation helpers ──────────────────────────────────────────────────────

function avg(arr: number[]): number | null {
  if (!arr.length) return null
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

interface AvgStats {
  cspm:       number | null
  vision:     number | null
  damage:     number | null
  kda:        number | null
  deaths:     number | null
  kills:      number | null
  healShield: number | null
  ccScore:    number | null
  cw:         number | null
  wardsPlaced:number | null
  gpm:        number | null
}

function computeAvg(games: Game[]): AvgStats {
  const dur = (g: Game) => (g.duration ?? 0) / 60

  return {
    cspm:        avg(games.filter(g => g.cs != null && (g.duration ?? 0) > 0).map(g => g.cs! / dur(g))),
    vision:      avg(games.filter(g => g.vision_score != null).map(g => g.vision_score!)),
    damage:      avg(games.filter(g => g.damage_to_champs != null).map(g => g.damage_to_champs!)),
    kda:         avg(games.filter(g => g.kills != null && g.deaths != null).map(g =>
                   (g.deaths! > 0 ? ((g.kills! + (g.assists ?? 0)) / g.deaths!) : (g.kills! + (g.assists ?? 0)))
                 )),
    deaths:      avg(games.filter(g => g.deaths != null).map(g => g.deaths!)),
    kills:       avg(games.filter(g => g.kills != null).map(g => g.kills!)),
    healShield:  avg(games.filter(g => (g.heal_shield ?? 0) > 0).map(g => g.heal_shield!)),
    ccScore:     avg(games.filter(g => (g.cc_score ?? 0) > 0).map(g => g.cc_score!)),
    cw:          avg(games.filter(g => g.control_wards != null).map(g => g.control_wards!)),
    wardsPlaced: avg(games.filter(g => g.wards_placed != null).map(g => g.wards_placed!)),
    gpm:         avg(games.filter(g => g.gold_earned != null && (g.duration ?? 0) > 0).map(g => g.gold_earned! / dur(g))),
  }
}

// ─── Champion fit evaluation ──────────────────────────────────────────────────

interface FitResult {
  verdict: "natural-fit" | "decent-match" | "consider-alternatives"
  score: number        // 0-100
  strengths: string[]
  weaknesses: string[]
}

function evaluateFit(archetype: Archetype, stats: AvgStats): FitResult {
  const checks: { pass: boolean; strength: string; weakness: string }[] = []

  switch (archetype) {
    case "ENGAGE_SUPPORT":
      checks.push({
        pass: (stats.ccScore ?? 0) >= 15,
        strength: `Goede CC output (${stats.ccScore?.toFixed(0) ?? 0}s)`,
        weakness: `CC score ${stats.ccScore?.toFixed(0) ?? 0}s — engage supports hebben ≥15s nodig`,
      })
      checks.push({
        pass: (stats.vision ?? 0) >= 25,
        strength: `Solide vision control (${stats.vision?.toFixed(0) ?? 0})`,
        weakness: `Vision score ${stats.vision?.toFixed(0) ?? 0} — ook als engage support warden is verplicht`,
      })
      checks.push({
        pass: (stats.deaths ?? 99) <= 5,
        strength: `Overleeft goed (${stats.deaths?.toFixed(1) ?? "?"} deaths gem.)`,
        weakness: `${stats.deaths?.toFixed(1) ?? "?"} deaths per game — engage support mag niet eerst sterven`,
      })
      break

    case "HEALER_SUPPORT":
      checks.push({
        pass: (stats.healShield ?? 0) >= 4000,
        strength: `Hoge heal+shield output (${((stats.healShield ?? 0)/1000).toFixed(1)}k)`,
        weakness: `Heal+shield ${((stats.healShield ?? 0)/1000).toFixed(1)}k — enchanters hebben ≥4k per game nodig`,
      })
      checks.push({
        pass: (stats.vision ?? 0) >= 30,
        strength: `Goede vision control (${stats.vision?.toFixed(0) ?? 0})`,
        weakness: `Vision score ${stats.vision?.toFixed(0) ?? 0} — enchanter moet ook warden`,
      })
      checks.push({
        pass: (stats.cw ?? 0) >= 2,
        strength: `Regelmatig control wards (${stats.cw?.toFixed(1) ?? 0} gem.)`,
        weakness: `Slechts ${stats.cw?.toFixed(1) ?? 0} control ward gem. — koop er elke base`,
      })
      break

    case "POKE_SUPPORT":
      checks.push({
        pass: (stats.damage ?? 0) >= 8000,
        strength: `Solide poke damage (${((stats.damage ?? 0)/1000).toFixed(1)}k)`,
        weakness: `Schade ${((stats.damage ?? 0)/1000).toFixed(1)}k te laag — poke supports leven van constant drukken`,
      })
      checks.push({
        pass: (stats.vision ?? 0) >= 30,
        strength: `Goede vision (${stats.vision?.toFixed(0) ?? 0})`,
        weakness: `Vision score ${stats.vision?.toFixed(0) ?? 0} te laag voor poke support`,
      })
      break

    case "CARRY_ADC":
    case "POKE_ADC":
      checks.push({
        pass: (stats.cspm ?? 0) >= 6,
        strength: `Sterke farm (${stats.cspm?.toFixed(1) ?? 0} CS/min)`,
        weakness: `${stats.cspm?.toFixed(1) ?? 0} CS/min — carries hebben 6+ nodig om items bij te houden`,
      })
      checks.push({
        pass: (stats.damage ?? 0) >= 14000,
        strength: `Goede damage output (${((stats.damage ?? 0)/1000).toFixed(1)}k)`,
        weakness: `${((stats.damage ?? 0)/1000).toFixed(1)}k damage — als ADC moet je de carry zijn`,
      })
      checks.push({
        pass: (stats.deaths ?? 99) <= 5,
        strength: `Overleeft goed in teamfights`,
        weakness: `${stats.deaths?.toFixed(1) ?? "?"} deaths — ADC deaths zijn kritiek, blijf in de backline`,
      })
      break

    case "ASSASSIN_MID":
      checks.push({
        pass: (stats.kills ?? 0) >= 4,
        strength: `Maakt picks (${stats.kills?.toFixed(1) ?? 0} kills gem.)`,
        weakness: `${stats.kills?.toFixed(1) ?? 0} kills gem. — assassins moeten snowballen via early kills`,
      })
      checks.push({
        pass: (stats.deaths ?? 99) <= 4,
        strength: `Speelt safe (${stats.deaths?.toFixed(1) ?? 0} deaths)`,
        weakness: `${stats.deaths?.toFixed(1) ?? 0} deaths — assassin mag niet sterven voordat carries zijn`,
      })
      checks.push({
        pass: (stats.cspm ?? 0) >= 5,
        strength: `Houdt farm bij (${stats.cspm?.toFixed(1) ?? 0} CS/min)`,
        weakness: `${stats.cspm?.toFixed(1) ?? 0} CS/min — push wave eerst, roam dan`,
      })
      break

    case "MAGE_MID":
      checks.push({
        pass: (stats.cspm ?? 0) >= 6,
        strength: `Goede farm routine (${stats.cspm?.toFixed(1) ?? 0} CS/min)`,
        weakness: `${stats.cspm?.toFixed(1) ?? 0} CS/min — mages schalen met items, farm is prioriteit`,
      })
      checks.push({
        pass: (stats.damage ?? 0) >= 16000,
        strength: `Hoge teamfight schade (${((stats.damage ?? 0)/1000).toFixed(1)}k)`,
        weakness: `${((stats.damage ?? 0)/1000).toFixed(1)}k damage — als mage ben je de magic damage bron van je team`,
      })
      break

    case "BRUISER_TOP":
      checks.push({
        pass: (stats.cspm ?? 0) >= 5.5,
        strength: `Solide farm (${stats.cspm?.toFixed(1) ?? 0} CS/min)`,
        weakness: `${stats.cspm?.toFixed(1) ?? 0} CS/min — top is een farmlane, doel 6+`,
      })
      checks.push({
        pass: (stats.deaths ?? 99) <= 5,
        strength: `Speelt gedisciplineerd (${stats.deaths?.toFixed(1) ?? 0} deaths)`,
        weakness: `${stats.deaths?.toFixed(1) ?? 0} deaths — bruisers die teveel sterven verliezen hun lane dominantie`,
      })
      break

    case "TANK_TOP":
    case "TANK_JG":
      checks.push({
        pass: (stats.deaths ?? 99) <= 5,
        strength: `Tankt goed (${stats.deaths?.toFixed(1) ?? 0} deaths)`,
        weakness: `${stats.deaths?.toFixed(1) ?? 0} deaths — tank sterft als eerste, maar niet te vroeg`,
      })
      if (stats.ccScore != null) {
        checks.push({
          pass: (stats.ccScore ?? 0) >= 20,
          strength: `Hoge CC impact (${stats.ccScore?.toFixed(0) ?? 0}s)`,
          weakness: `CC score ${stats.ccScore?.toFixed(0) ?? 0}s laag — tanks winnen via CC chains`,
        })
      }
      break

    case "SKIRMISH_JG":
      checks.push({
        pass: (stats.cspm ?? 0) >= 4,
        strength: `Goede jungle clear (${stats.cspm?.toFixed(1) ?? 0} CS/min)`,
        weakness: `${stats.cspm?.toFixed(1) ?? 0} CS/min — skirmish junglers moeten camps clearen tussendoor`,
      })
      checks.push({
        pass: (stats.deaths ?? 99) <= 4,
        strength: `Positieve deaths (${stats.deaths?.toFixed(1) ?? 0})`,
        weakness: `${stats.deaths?.toFixed(1) ?? 0} deaths — invade niet zonder vision`,
      })
      break
  }

  const passed   = checks.filter(c => c.pass).length
  const failed   = checks.filter(c => !c.pass).length
  const total    = checks.length
  const score    = total > 0 ? Math.round((passed / total) * 100) : 50

  const verdict: FitResult["verdict"] =
    score >= 70 ? "natural-fit" :
    score >= 40 ? "decent-match" :
    "consider-alternatives"

  return {
    verdict,
    score,
    strengths:  checks.filter(c =>  c.pass).map(c => c.strength),
    weaknesses: checks.filter(c => !c.pass).map(c => c.weakness),
  }
}

// ─── Next session tips ────────────────────────────────────────────────────────

interface Tip {
  priority: "high" | "normal"
  title: string
  body: string
  icon: "vision" | "cs" | "deaths" | "damage" | "mental" | "heal" | "cc" | "self"
}

function generateTips(
  stats: AvgStats,
  role: string | undefined,
  reflection: PostGameReflection | null,
  winRate: number
): Tip[] {
  const tips: Tip[] = []
  const r = (role ?? "").toUpperCase()

  // Mental / tilt
  if (winRate < 40 && (reflection?.tiltMoments ?? 0) >= 2) {
    tips.push({
      priority: "high",
      title: "Reset je mentale staat",
      body: `Winrate van ${winRate}% met ${reflection?.tiltMoments} tilt-momenten. Neem een pauze van 20-30 min voor je volgende sessie. Speel je volgende sessie met een lagere inzet (normals of aram).`,
      icon: "mental",
    })
  }

  // Stop condition
  if (reflection && !reflection.followedStopCondition) {
    tips.push({
      priority: "high",
      title: "Volg je stop condition",
      body: "Je hebt je stop condition niet gevolgd. Discipline is de grootste indicator van rank vooruitgang. Stel een harde limiet in voor de volgende sessie en commit er aan.",
      icon: "mental",
    })
  }

  if (r === "SUPPORT") {
    if ((stats.vision ?? 99) < 30) {
      tips.push({
        priority: "high",
        title: "Vision control verbeteren",
        body: `Gemiddeld ${stats.vision?.toFixed(0) ?? "?"} vision score. Concreet: ward elke base (tri-bush + river + pixel brush), koop ALTIJD een control ward bij je trinket, upgrade trinket op level 9.`,
        icon: "vision",
      })
    }
    if ((stats.cw ?? 0) < 2) {
      tips.push({
        priority: "high",
        title: "Meer control wards kopen",
        body: `${stats.cw?.toFixed(1) ?? 0} control ward gem. per game. Doel: minimaal 2 per game. Control wards zijn 75g en blokkeren enemy vision — de beste gold-efficient aankoop in het spel.`,
        icon: "vision",
      })
    }
    if ((stats.healShield ?? 0) > 0 && (stats.healShield ?? 0) < 4000) {
      tips.push({
        priority: "normal",
        title: "Heal/shield output omhoog",
        body: `${((stats.healShield ?? 0)/1000).toFixed(1)}k heal+shield gem. Positioneer dichter bij je carry tijdens fights. Pre-shield voor engage, niet na de eerste schade.`,
        icon: "heal",
      })
    }
  } else {
    if ((stats.cspm ?? 10) < 6) {
      tips.push({
        priority: "high",
        title: "CS/min is je #1 prioriteit",
        body: `${stats.cspm?.toFixed(1) ?? "?"} CS/min — elke 15 gemiste CS is een item component verloren. Oefen 10 min in Practice Tool: doel is 7 CS/min zonder abilities. Push wave voor je roamt.`,
        icon: "cs",
      })
    }
    if ((stats.deaths ?? 0) >= 5) {
      tips.push({
        priority: "high",
        title: "Minder sterven per game",
        body: `${stats.deaths?.toFixed(1) ?? "?"} deaths per game. Actieplan: recall bij 40% HP in plaats van 20%, ward voor roaming vijanden, trade alleen met wave advantage. Elke death = 300g voor de vijand.`,
        icon: "deaths",
      })
    }
    if ((stats.vision ?? 99) < 15) {
      tips.push({
        priority: r === "JUNGLE" ? "high" : "normal",
        title: "Basis warding ontbreekt",
        body: `Vision score ${stats.vision?.toFixed(0) ?? "?"} is te laag. Gebruik trinket op cooldown, koop 1 control ward per base. ${r === "JUNGLE" ? "Als jungler: ward objectives 1 min voor spawn." : ""}`,
        icon: "vision",
      })
    }
    if (r === "MID" || r === "BOTTOM") {
      if ((stats.damage ?? 0) > 0 && (stats.damage ?? 0) < 12000) {
        tips.push({
          priority: "normal",
          title: "Meer schade uitdelen in teamfights",
          body: `${((stats.damage ?? 0)/1000).toFixed(1)}k damage gem. Als carry ben je de damage bron van je team. Oefen: in teamfights altijd iets aanvallen, ook al is het een tank. Auto-attacks gaan ook door.`,
          icon: "damage",
        })
      }
    }
  }

  // Reflection focus (user's own words)
  if (reflection?.improvementFocus) {
    tips.push({
      priority: "normal",
      title: "Jouw eigen verbeterpunt",
      body: `"${reflection.improvementFocus}" — schrijf dit bovenaan je volgende pre-game check-in als herinnering.`,
      icon: "self",
    })
  }
  if (reflection?.biggestMistake) {
    tips.push({
      priority: "normal",
      title: "Herhaal deze fout niet",
      body: `Je noteerde: "${reflection.biggestMistake}". Bedenk één concrete aanpassing voor de volgende sessie om dit te voorkomen.`,
      icon: "self",
    })
  }

  // Cap at 4 tips, high priority first
  return tips
    .sort((a, b) => (a.priority === "high" ? -1 : 1) - (b.priority === "high" ? -1 : 1))
    .slice(0, 4)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCircle({ label, value, max, color, display, status }: {
  label: string; value: number | null; max: number; color: string; display: string; status: string
}) {
  if (value == null) return null
  const pct   = Math.min(value / max, 1)
  const r     = 28
  const circ  = 2 * Math.PI * r
  const arc   = circ * pct
  const gap   = circ - arc
  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      <div className="relative" style={{ width: 72, height: 72 }}>
        <svg viewBox="0 0 72 72" width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
          {/* Dashed background ring */}
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" strokeDasharray="3 4" />
          {/* Colored arc */}
          <circle
            cx="36" cy="36" r={r} fill="none"
            stroke={color} strokeWidth="5"
            strokeDasharray={`${arc} ${gap}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 3px ${color}90)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black tabular-nums" style={{ color }}>{display}</span>
        </div>
      </div>
      <p className="text-xs font-bold text-foreground text-center leading-tight">{label}</p>
      <p className="text-[10px] text-muted-foreground/70 text-center leading-tight">{status}</p>
    </div>
  )
}

const TIP_ICON = {
  vision:  <Eye        className="h-4 w-4 shrink-0 mt-0.5" />,
  cs:      <Swords     className="h-4 w-4 shrink-0 mt-0.5" />,
  deaths:  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />,
  damage:  <Zap        className="h-4 w-4 shrink-0 mt-0.5" />,
  mental:  <Brain      className="h-4 w-4 shrink-0 mt-0.5" />,
  heal:    <Shield     className="h-4 w-4 shrink-0 mt-0.5" />,
  cc:      <Target     className="h-4 w-4 shrink-0 mt-0.5" />,
  self:    <Info       className="h-4 w-4 shrink-0 mt-0.5" />,
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SessionInsights({ games, role, checkin, reflection }: SessionInsightsProps) {
  if (!games.length) return null

  const stats   = computeAvg(games)
  const r       = (role ?? "").toUpperCase()
  const isSupport = r === "SUPPORT"

  const wins    = games.filter(g => g.result === "win").length
  const winRate = games.length > 0 ? Math.round((wins / games.length) * 100) : 0

  const tips    = generateTips(stats, role, reflection, winRate)

  // Unique champions played
  const champCounts: Record<string, number> = {}
  for (const g of games) {
    if (g.champion) champCounts[g.champion] = (champCounts[g.champion] ?? 0) + 1
  }
  const uniqueChamps = Object.entries(champCounts).sort((a, b) => b[1] - a[1]).map(([c]) => c)

  const GLASS: React.CSSProperties = {
    background: "rgba(30,31,37,0.7)",
    backdropFilter: "blur(16px)",
    borderTop: "1px solid rgba(133,147,153,0.15)",
    borderLeft: "1px solid rgba(133,147,153,0.15)",
    borderRight: "1px solid rgba(133,147,153,0.06)",
    borderBottom: "1px solid rgba(133,147,153,0.06)",
  }

  return (
    <div className="space-y-6">

      {/* ── Section header ────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-0.5">
          Analyse
        </p>
        <h2 className="text-xl font-bold text-foreground">Sessie inzichten &amp; volgende stappen</h2>
      </div>

      {/* ── Performance overview ──────────────────────────────────────────── */}
      <div className="rounded-xl border p-5 space-y-4" style={GLASS}>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Gemiddelde prestaties per game
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {isSupport ? (
            <>
              <StatCircle label="Vision"       value={stats.vision}      max={80}    color={stats.vision    != null && stats.vision    >= 40 ? "#34d399" : stats.vision    != null && stats.vision    >= 25 ? "#fbbf24" : "#f87171"} display={stats.vision?.toFixed(0) ?? "—"}       status={stats.vision    != null && stats.vision    >= 40 ? "Excellent" : stats.vision    != null && stats.vision    >= 25 ? "Average" : "Needs Work"} />
              <StatCircle label="Wards"        value={stats.wardsPlaced} max={40}    color={stats.wardsPlaced != null && stats.wardsPlaced >= 15 ? "#34d399" : "#fb923c"}                                                           display={stats.wardsPlaced?.toFixed(0) ?? "—"} status={stats.wardsPlaced != null && stats.wardsPlaced >= 15 ? "Good" : "Needs Work"} />
              <StatCircle label="Ctrl Wards"   value={stats.cw}          max={5}     color={stats.cw != null && stats.cw >= 2 ? "#34d399" : "#f87171"}                                                                              display={stats.cw?.toFixed(1) ?? "—"}          status={stats.cw != null && stats.cw >= 2 ? "Good" : "Needs Work"} />
              {stats.healShield != null && stats.healShield > 0 && (
                <StatCircle label="Heal+Shield" value={stats.healShield} max={15000} color={stats.healShield >= 5000 ? "#34d399" : "#fbbf24"}                                                                                       display={`${(stats.healShield/1000).toFixed(1)}k`} status={stats.healShield >= 5000 ? "Good" : "Average"} />
              )}
              {stats.ccScore != null && stats.ccScore > 0 && (
                <StatCircle label="CC"          value={stats.ccScore}    max={60}    color={stats.ccScore >= 20 ? "#34d399" : "#fbbf24"}                                                                                            display={`${stats.ccScore.toFixed(0)}s`}       status={stats.ccScore >= 20 ? "Good" : "Average"} />
              )}
            </>
          ) : (
            <>
              <StatCircle label="CS / min"     value={stats.cspm}        max={10}    color={stats.cspm    != null && stats.cspm    >= 7 ? "#34d399" : stats.cspm    != null && stats.cspm    >= 5 ? "#fbbf24" : "#f87171"} display={stats.cspm?.toFixed(1) ?? "—"}   status={stats.cspm    != null && stats.cspm    >= 7 ? "Excellent" : stats.cspm    != null && stats.cspm    >= 5 ? "Average" : "Needs Work"} />
              <StatCircle label="KDA"          value={stats.kda}         max={6}     color={stats.kda     != null && stats.kda     >= 3 ? "#34d399" : stats.kda     != null && stats.kda     >= 2 ? "#fbbf24" : "#f87171"} display={stats.kda?.toFixed(1) ?? "—"}    status={stats.kda     != null && stats.kda     >= 3 ? "Excellent" : stats.kda     != null && stats.kda     >= 2 ? "Average" : "Needs Work"} />
              {stats.damage != null && (
                <StatCircle label="Damage"     value={stats.damage}      max={35000} color={stats.damage  != null && stats.damage  >= 20000 ? "#34d399" : stats.damage  != null && stats.damage  >= 12000 ? "#fbbf24" : "#f87171"} display={`${(stats.damage/1000).toFixed(1)}k`} status={stats.damage != null && stats.damage >= 20000 ? "Excellent" : stats.damage != null && stats.damage >= 12000 ? "Average" : "Needs Work"} />
              )}
              <StatCircle label="Vision"       value={stats.vision}      max={60}    color={stats.vision  != null && stats.vision  >= 25 ? "#34d399" : "#f87171"}                                                           display={stats.vision?.toFixed(0) ?? "—"} status={stats.vision  != null && stats.vision  >= 25 ? "Good" : "Needs Work"} />
            </>
          )}
          <StatCircle label="Deaths"         value={stats.deaths}        max={10}    color={stats.deaths  != null && stats.deaths  <= 3 ? "#34d399" : stats.deaths  != null && stats.deaths  <= 5 ? "#fbbf24" : "#f87171"} display={stats.deaths?.toFixed(1) ?? "—"} status={stats.deaths  != null && stats.deaths  <= 3 ? "Excellent" : stats.deaths  != null && stats.deaths  <= 5 ? "Average" : "Needs Work"} />
          {stats.gpm != null && (
            <StatCircle label="Gold / min"   value={stats.gpm}           max={450}   color={stats.gpm     >= 350 ? "#34d399" : stats.gpm >= 280 ? "#fbbf24" : "#f87171"}                                                   display={`${stats.gpm.toFixed(0)}`}       status={stats.gpm >= 350 ? "Excellent" : stats.gpm >= 280 ? "Average" : "Needs Work"} />
          )}
        </div>
      </div>

      {/* ── Champion fit + Tips — side by side ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── Champion fit ──────────────────────────────────────────────────── */}
      {uniqueChamps.length > 0 && (
        <div className="rounded-xl border p-5 space-y-4" style={GLASS}>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Champion speelstijl analyse
          </p>
          <div className="space-y-4">
            {uniqueChamps.map(champ => {
              // Normalise name (remove spaces/apostrophes for lookup)
              const slug = champ.replace(/[^a-zA-Z]/g, "")
              const archetypeKey = (CHAMPION_ARCHETYPE[slug] ?? CHAMPION_ARCHETYPE[champ]) as Archetype | undefined
              const archInfo = archetypeKey ? ARCHETYPE_INFO[archetypeKey] : null
              const fit = archetypeKey ? evaluateFit(archetypeKey, stats) : null

              const gamesWithChamp = games.filter(g => g.champion === champ)
              const winsWithChamp  = gamesWithChamp.filter(g => g.result === "win").length
              const wrChamp        = gamesWithChamp.length > 0
                ? Math.round((winsWithChamp / gamesWithChamp.length) * 100) : 0

              const verdictColor =
                fit?.verdict === "natural-fit"           ? "#34d399" :
                fit?.verdict === "decent-match"          ? "#fbbf24" :
                fit?.verdict === "consider-alternatives" ? "#f87171" : "#818cf8"

              const verdictLabel =
                fit?.verdict === "natural-fit"           ? "Natural Fit"          :
                fit?.verdict === "decent-match"          ? "Decent Match"         :
                fit?.verdict === "consider-alternatives" ? "Overweeg Alternatief" : "Onbekend"

              return (
                <div
                  key={champ}
                  className="rounded-lg border p-4 space-y-3"
                  style={{
                    background: `linear-gradient(135deg, ${verdictColor}06, rgba(14,15,20,0.8))`,
                    borderColor: `${verdictColor}20`,
                  }}
                >
                  {/* Champion header */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold text-foreground">{champ}</span>
                          {archInfo && (
                            <span
                              className="text-[13px] font-black uppercase tracking-widest px-1.5 py-0.5 border"
                              style={{ borderColor: `${verdictColor}30`, color: verdictColor, background: `${verdictColor}08` }}
                            >
                              {archInfo.label}
                            </span>
                          )}
                        </div>
                        {archInfo && (
                          <p className="text-sm text-muted-foreground mt-1">{archInfo.playstyle}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Games</p>
                        <p className="text-sm font-bold text-foreground">{gamesWithChamp.length} ({wrChamp}% WR)</p>
                      </div>
                      {fit && (
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 border text-xs font-black uppercase tracking-widest"
                          style={{ borderColor: `${verdictColor}40`, color: verdictColor, background: `${verdictColor}08` }}
                        >
                          {fit.verdict === "natural-fit" ? <CheckCircle2 className="h-3 w-3" /> : fit.verdict === "consider-alternatives" ? <XCircle className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                          {verdictLabel}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Win condition */}
                  {archInfo && (
                    <div
                      className="text-sm px-3 py-2.5 border-l-2"
                      style={{ borderColor: `${verdictColor}60`, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.02)" }}
                    >
                      <span className="font-black uppercase tracking-wide" style={{ color: verdictColor }}>Win conditie: </span>
                      {archInfo.winCondition}
                    </div>
                  )}

                  {/* Strengths + Weaknesses */}
                  {fit && (fit.strengths.length > 0 || fit.weaknesses.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {fit.strengths.length > 0 && (
                        <div className="space-y-2">
                          {fit.strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="text-foreground/80">{s}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {fit.weaknesses.length > 0 && (
                        <div className="space-y-2">
                          {fit.weaknesses.map((w, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                              <span className="text-foreground/80">{w}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alternatives */}
                  {fit?.verdict === "consider-alternatives" && archInfo?.alternatives && (
                    <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                      <span className="font-black uppercase tracking-wide">Alternatieven:</span>
                      {archInfo.alternatives.map(alt => (
                        <span
                          key={alt}
                          className="px-2 py-0.5 border font-bold"
                          style={{ borderColor: "rgba(133,147,153,0.2)", color: "#a4e6ff" }}
                        >
                          {alt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Next session tips ─────────────────────────────────────────────── */}
      {tips.length > 0 && (
        <div className="rounded-xl border p-5 space-y-4 h-fit" style={GLASS}>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Focus voor de volgende sessie
          </p>
          <div className="space-y-3">
            {tips.map((tip, i) => {
              const high = tip.priority === "high"
              const accent = high ? "#fb923c" : "#4cd6ff"
              return (
                <div
                  key={i}
                  className="rounded-lg border p-4 flex items-start gap-3"
                  style={{
                    background: `linear-gradient(135deg, ${accent}06, rgba(14,15,20,0.9))`,
                    borderColor: `${accent}25`,
                    borderLeft: `3px solid ${accent}`,
                  }}
                >
                  <span style={{ color: accent }}>{TIP_ICON[tip.icon]}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {high && (
                        <span
                          className="text-[13px] font-black uppercase tracking-widest px-1.5 py-0.5 border"
                          style={{ borderColor: "#fb923c40", color: "#fb923c", background: "#fb923c08" }}
                        >
                          Prioriteit
                        </span>
                      )}
                      <p className="text-sm font-black text-foreground uppercase tracking-wide">{tip.title}</p>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{tip.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      </div> {/* end side-by-side grid */}
    </div>
  )
}
