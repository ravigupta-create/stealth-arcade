/* === Shared Utilities & Word Lists === */
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const randChoice = arr => arr[Math.floor(Math.random() * arr.length)];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = randInt(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const WORDS5 = ["about","above","abuse","actor","acute","admit","adopt","adult","after","again","agent","agree","ahead","alarm","album","alert","alien","align","alive","alley","allow","alone","along","alter","among","angel","anger","angle","angry","anime","apart","apple","apply","arena","argue","arise","aside","asset","audio","avoid","awake","award","aware","awful","badly","baker","bases","basic","basis","beach","begin","being","below","bench","bible","blank","blast","blaze","bleed","blend","bless","blind","block","blood","bloom","blown","board","bonus","boost","bound","brain","brand","brave","bread","break","breed","brick","brief","bring","broad","broke","brown","brush","buddy","build","bunch","burst","buyer","cabin","cable","camel","candy","cargo","carry","catch","cause","chain","chair","chalk","champ","chaos","charm","chart","chase","cheap","check","cheek","chess","chest","chief","child","chill","china","chunk","civic","civil","claim","clash","class","clean","clear","climb","cling","clock","clone","close","cloud","coach","coast","color","comet","comic","coral","corps","couch","could","count","court","cover","crack","craft","crane","crash","crazy","cream","creek","creep","crest","crime","crisp","cross","crowd","crown","crude","crush","curve","cycle","daily","dance","death","debug","decay","delay","delta","demon","dense","depth","derby","devil","diary","dirty","disco","ditch","dizzy","dodge","doing","donor","doubt","dough","draft","drain","drake","drama","drank","drawn","dream","dress","dried","drift","drink","drive","drone","drove","dryer","dummy","dunno","dusty","dwarf","dying","eager","eagle","early","earth","eaten","eight","elect","elite","email","ember","empty","ended","enemy","enjoy","enter","entry","equal","equip","error","essay","event","every","exact","exile","exist","extra","fable","facet","faint","fairy","faith","false","fancy","fatal","fault","feast","fence","ferry","fetch","fever","fiber","field","fifth","fifty","fight","final","first","fixed","flame","flash","flesh","flick","fling","float","flock","flood","floor","flour","fluid","flush","focal","focus","force","forge","forth","forty","forum","found","frame","frank","fraud","fresh","front","frost","froze","fruit","fully","fungi","funny","gamma","gauge","geese","genre","ghost","giant","given","glare","glass","gleam","glide","globe","gloom","glory","gloss","glove","going","grace","grade","grain","grand","grant","grape","graph","grasp","grass","grave","great","greed","green","greet","grief","grill","grind","groan","groom","gross","group","grove","growl","grown","guard","guess","guest","guide","guild","guilt","guise","gusty","habit","happy","harsh","haste","haunt","haven","heart","heavy","hence","herbs","hinge","honey","honor","horse","hotel","house","human","humor","hurry","hyper","ideal","image","imply","index","indie","inner","input","irony","issue","ivory","jenny","jewel","joker","jolly","joust","judge","juice","juicy","jumbo","karma","kayak","kebab","knack","knead","kneel","knife","knock","known","label","lance","large","laser","later","laugh","layer","learn","lease","least","leave","legal","lemon","level","light","lilac","liken","limit","linen","liner","llama","local","lodge","logic","login","longe","loose","lover","lower","loyal","lucky","lunar","lunch","lunge","lusty","lying","lyric","macro","magic","major","maker","mango","manor","maple","march","marsh","match","mayor","mealy","media","mercy","merge","merit","merry","messy","metal","meter","might","minor","minus","mirth","model","money","month","moral","motor","mount","mouse","mouth","movie","muddy","mural","music","naive","nasty","naval","nerve","never","newly","nexus","night","noble","noise","north","noted","novel","nurse","nylon","oasis","occur","ocean","olive","onset","opera","orbit","order","organ","other","ought","outer","owner","oxide","ozone","paint","panel","panic","party","pasta","paste","patch","pause","peace","peach","pearl","pedal","penny","perch","phase","phone","photo","piano","piece","pilot","pinch","pitch","pixel","pizza","place","plain","plane","plant","plate","plaza","plead","pluck","plumb","plume","plump","plunge","point","polar","porch","poser","pound","power","press","price","pride","prime","print","prior","prize","probe","prone","proof","proud","prove","psalm","punch","pupil","purse","queen","query","quest","queue","quick","quiet","quilt","quirk","quota","quote","radar","radio","rainy","raise","rally","ranch","range","rapid","raven","reach","react","ready","realm","rebel","refer","reign","relax","renew","repay","reply","resin","retro","rider","ridge","rifle","right","rigid","rival","river","robin","robot","rocky","rogue","roman","roost","rouge","rough","round","route","royal","rugby","ruler","rural","sadly","saint","salad","salon","sandy","sauce","scale","scare","scene","scent","scope","scout","scrap","serve","setup","seven","shade","shaft","shake","shall","shame","shape","share","shark","sharp","shave","shear","sheer","sheet","shelf","shell","shift","shine","shirt","shock","shoot","shore","shout","shove","sight","sigma","since","sixth","sixty","sized","skill","skull","slate","sleep","slice","slide","slope","smart","smell","smile","smoke","snake","solar","solid","solve","sonic","sorry","sound","south","space","spare","spark","spawn","speak","spear","speed","spend","spice","spike","spine","spite","split","spoke","spoon","spray","squad","stack","staff","stage","stain","stake","stale","stalk","stall","stamp","stand","stare","stark","start","state","stays","steak","steal","steam","steel","steep","steer","stern","stick","stiff","still","sting","stock","stoic","stone","stood","store","storm","story","stout","stove","strap","straw","stray","strip","stuck","study","stuff","style","sugar","suite","sunny","super","surge","swamp","swarm","swear","sweat","sweep","sweet","swept","swift","swing","swiss","sword","syrup","table","taste","teach","teeth","tempo","tense","terms","theft","their","theme","there","these","thick","thing","think","third","thorn","those","three","threw","throw","thumb","tidal","tiger","tight","timer","tired","title","today","token","total","touch","tough","tower","toxic","trace","track","trade","trail","train","trait","trash","treat","trend","trial","tribe","trick","tried","troop","truck","truly","trump","trunk","trust","truth","tumor","tuner","twice","twist","tying","udder","ultra","uncle","under","undid","union","unite","unity","until","upper","upset","urban","usage","usual","utter","vague","valid","value","valve","vault","verse","vigor","vinyl","viola","viral","virus","visit","vista","vital","vivid","vocal","vodka","voice","voter","vowel","vulky","wages","wagon","waist","waste","watch","water","weary","weave","wedge","weird","wheat","wheel","where","which","while","white","whole","whose","wider","widow","width","witch","woman","women","woods","world","worry","worse","worst","worth","would","wound","wrath","wrist","write","wrong","wrote","yacht","yield","young","youth","zebra"];

const WORDS_HANGMAN = ["elephant","computer","sunshine","mountain","umbrella","dinosaur","princess","treasure","football","baseball","swimming","birthday","sandwich","broccoli","kangaroo","dolphin","penguin","volcano","rainbow","guitar","library","monster","chicken","pancake","blanket","diamond","kitchen","lantern","lobster","mushroom","popcorn","pumpkin","thunder","firefly","crystal","penguin","teacher","village","whistle","journey","pyramid","hammock","octopus","giraffe","buffalo","compass","pilgrim","caramel","avocado","fantasy"];

const TYPING_TEXTS = [
    "The quick brown fox jumps over the lazy dog near the river bank.",
    "She sells sea shells by the sea shore every summer morning.",
    "A journey of a thousand miles begins with a single step forward.",
    "To be or not to be that is the question we must answer.",
    "All that glitters is not gold but some things shine brighter.",
    "The early bird catches the worm but the second mouse gets cheese.",
    "Practice makes perfect when you put in effort every single day.",
    "Every great dream begins with a dreamer who never gives up.",
    "Life is what happens when you are busy making other plans.",
    "The only way to do great work is to love what you do daily."
];

const EMOJIS_MEMORY = ["🐶","🐱","🐼","🦊","🐸","🦋","🐙","🦄","🍕","🎸","🚀","🌈","💎","🎯","🌺","🍄","⚡","🎪"];

/* Base class for canvas games */
class CanvasGame {
    constructor(canvas, ctx, ui, api) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui; this.api = api;
        this.running = false; this.score = 0; this.raf = null;
        this._boundKeys = []; this._boundClicks = []; this._intervals = [];
    }
    listenKey(fn) { const b = fn.bind(this); this._boundKeys.push(b); document.addEventListener('keydown', b); }
    listenClick(fn) { const b = fn.bind(this); this._boundClicks.push(b); this.canvas.addEventListener('click', b); }
    listenMouse(evt, fn) { const b = fn.bind(this); this._boundClicks.push([evt, b]); this.canvas.addEventListener(evt, b); }
    addInterval(fn, ms) { const id = setInterval(fn.bind(this), ms); this._intervals.push(id); return id; }
    addTimeout(fn, ms) { const id = setTimeout(fn.bind(this), ms); this._intervals.push(id); return id; }
    stop() {
        this.running = false;
        cancelAnimationFrame(this.raf);
        this._boundKeys.forEach(b => document.removeEventListener('keydown', b));
        this._boundClicks.forEach(b => Array.isArray(b) ? this.canvas.removeEventListener(b[0], b[1]) : this.canvas.removeEventListener('click', b));
        this._intervals.forEach(id => { clearInterval(id); clearTimeout(id); });
        this._boundKeys = []; this._boundClicks = []; this._intervals = [];
    }
    loop() { if (!this.running) return; this.update(); this.render(); this.raf = requestAnimationFrame(() => this.loop()); }
    setScore(s) { this.score = s; this.api.setScore(s); }
    endGame() { this.running = false; cancelAnimationFrame(this.raf); this.api.gameOver(this.score); }
    clear(color = '#0f0f1a') { this.ctx.fillStyle = color; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); }
    text(txt, x, y, size = 20, color = '#e0e0e0', align = 'center') {
        this.ctx.fillStyle = color; this.ctx.font = `${size}px sans-serif`; this.ctx.textAlign = align; this.ctx.fillText(txt, x, y);
    }
    showOverlay(title, subtitle, btnText = 'Play Again') {
        this.ui.innerHTML = `<div class="game-overlay"><h2>${title}</h2><p>${subtitle}</p><button onclick="document.getElementById('restart-btn').click()">${btnText}</button></div>`;
    }
}
