/* eslint-disable @next/next/no-img-element -- Customizable remote photo URLs and decorative images are intentionally rendered directly. */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type JourneyStage = 'intro' | 'game' | 'gift' | 'story';
type ThemeId = 'blush' | 'sky' | 'lilac' | 'sage' | 'midnight';

interface GiftData {
  name: string;
  nickname: string;
  from: string;
  password: string;
  passwordHint: string;
  intro: string;
  message: string;
  ending: string;
  wish: string;
  theme: ThemeId;
  photos: { src: string; caption: string; type?: 'image' | 'video' }[];
}

interface FallingItem { id: number; x: number; y: number; icon: string; }

const defaultGift: GiftData = {
  name: 'Ahmad Musthovi', nickname: 'BB', from: 'Anggesti',
  password: '0710', passwordHint: 'Tanggal spesial kita: 7 Oktober.',
  intro: 'Ehh, kamu pastii lagi ketawakan dan senyum-senyum sendiri. Bukaa inii, for you BB acuuuu 💙',
  message: 'Hey heyy my lvv akkk. Tepat sekarang tanggal 6 Oktober aku tulis ini pada pukul 7.32 pagii pas, kamu tau gaa aku sambil muterin lagu yang sekarang kamu denger inii tau BB. Jadiiiii aku mau ngucapin selamatt ulang tahun sayangku cintaa dann pastinyaa happy anivv my lv 💗 Semogaa sayangku ini yang paling utama selalu diberikan kesehatan dan kelancaraan ya sayang, semoga kamu bahagia selalu sayang sama akuuu hihii, kamu sekarang udah 22th aja ya asayangkuuu. Panjang umur dan selalu temenin akuu teruss ya sayangkuu. Aku ga janji dunia. Aku cuma janji bakal coba sebisa aku buat ada di samping kamu, dengerin kamu, dan support kamu dalam hal apa pun yang kamu pilih. Kamu ga perlu jalan sendirian karena pasti dan selalu ada cewe ini dihidupmu sayanggkuuuu. Makasih juga buat dirimu sendiri yaaa kamu keren, semogaa hal baik yang km lakukan ke akuu, berbalik ke dirimu ya sayanagggkuu. Sayangku udaa dewasaa yaa semoga semakinnn jos jisss seto rawonn pi boong wleee,,,,, intinya ak bangga punyaa km my love akuuuuu.',
  ending: 'Happy anniversary, BB. Love you lebih dari yang kata-kata bisa jelasin. Let’s keep going together 💗😗',
  wish: 'Semoga kita terus saling memilih dan menemani. You and me, against the world.',
  theme: 'sky',
  photos: [
    { src: '/customer/photos/bb-01.jpeg', caption: 'Pacarku selalu ganteng dan ganteng 💙' },
    { src: '/customer/photos/bb-02.jpeg', caption: 'Jangan lupa balik, BB. Aku mau pelukan lama. Sehat selalu ya sayang.' },
    { src: '/customer/photos/bb-03.jpeg', caption: 'Kitaa selucuu inii plss, tapi koo LDRrrr 😭' },
    { src: '/customer/photos/bb-04.mp4', type: 'video', caption: 'Aku benci LDR, tapi selalu bersyukur punya kamu. Cepat pulang, BB—aku mau pelukan lama.' },
  ],
};

const themes: Record<ThemeId, { name: string; accent: string; soft: string; ink: string; glow: string }> = {
  blush: { name: 'Blush Garden', accent: '#d94d7b', soft: '#fff3f6', ink: '#4d2431', glow: '#ffc4d7' },
  sky: { name: 'Blue Daydream', accent: '#4f8fc9', soft: '#eff8ff', ink: '#18344d', glow: '#bfe4ff' },
  lilac: { name: 'Lilac Dream', accent: '#8055c9', soft: '#f7f1ff', ink: '#382750', glow: '#dac8ff' },
  sage: { name: 'Sage Picnic', accent: '#4d8c70', soft: '#f0f8f2', ink: '#294638', glow: '#c5e7d3' },
  midnight: { name: 'Midnight Love', accent: '#8267e8', soft: '#11162d', ink: '#eef0ff', glow: '#536fff' },
};

const isThemeId = (value: unknown): value is ThemeId => typeof value === 'string' && value in themes;
const normalizeBirthdayPassword = (value: string) => value.replace(/\D/g, '').slice(0, 4);
const safeImageSource = (value: string, fallback: string) => {
  const source = value.trim();
  if (source.startsWith('/')) return source;
  try { return new URL(source).protocol === 'https:' ? source : fallback; }
  catch { return fallback; }
};

const readGiftFromUrl = (): GiftData => {
  if (typeof window === 'undefined' || !window.location.hash.startsWith('#gift=')) return defaultGift;
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(window.location.hash.slice(6))))) as Partial<GiftData>;
    const photos = Array.isArray(parsed.photos)
      ? parsed.photos.slice(0, 4).map((photo, index) => ({
          src: typeof photo?.src === 'string' && photo.src.trim() ? photo.src.trim() : defaultGift.photos[index]?.src ?? defaultGift.photos[0].src,
          caption: typeof photo?.caption === 'string' && photo.caption.trim() ? photo.caption.trim() : defaultGift.photos[index]?.caption ?? 'Kenangan favorit kita.',
          type: photo?.type === 'video' ? 'video' as const : 'image' as const,
        }))
      : defaultGift.photos;
    return {
      ...defaultGift,
      ...parsed,
      password: typeof parsed.password === 'string' && normalizeBirthdayPassword(parsed.password).length === 4 ? normalizeBirthdayPassword(parsed.password) : defaultGift.password,
      passwordHint: typeof parsed.passwordHint === 'string' && parsed.passwordHint.trim() ? parsed.passwordHint.trim() : defaultGift.passwordHint,
      theme: isThemeId(parsed.theme) ? parsed.theme : defaultGift.theme,
      photos: photos.length ? photos : defaultGift.photos,
    };
  } catch {
    return defaultGift;
  }
};

const floatingMotifs = Array.from({ length: 20 }, (_, index) => ({
  id: index, left: `${(index * 47) % 96}%`, top: `${8 + ((index * 31) % 84)}%`,
  delay: `${(index % 7) * -0.7}s`, icon: ['♥', '✿', '♡', '✦'][index % 4],
}));

const transitionFlowers = Array.from({ length: 36 }, (_, index) => {
  const column = index % 6;
  const row = Math.floor(index / 6);
  const distanceFromCenter = Math.hypot(column - 2.5, row - 2.5);
  return {
    id: index,
    x: `${(column - 2.5) * 19}vw`,
    y: `${(row - 2.5) * 19}vh`,
    rotation: `${(index * 71) % 360 - 180}deg`,
    scale: `${0.84 + ((index * 17) % 40) / 100}`,
    delay: `${Math.min(0.13, distanceFromCenter * 0.018)}s`,
  };
});

const musicTracks = [
  { title: 'Mesra-mesraannya kecil-kecilan dulu', mood: 'Sal Priadi', src: '/customer/music/mesra-mesraannya.mp3' },
  { title: 'All of Me', mood: 'John Legend', src: '/customer/music/all-of-me.mp3' },
  { title: 'To The Bone', mood: 'Pamungkas', src: '/customer/music/to-the-bone.mp3' },
] as const;

const envelopeLetters = [
  {
    emoji: '🎂', title: 'Birthday Boy',
    text: 'Happy birthday, BB sayangku! Semoga sayangku selalu diberikan kesehatan dan kebahagiaan. Panjang umur, terus temenin aku, dan jangan lupa kamu punya cewe yang selalu bangga sama kamu. Aku sayang kamu banyak-banyak 💙',
  },
  {
    emoji: '💞', title: 'Happy Anniversary',
    text: 'Aku bangga sama kita, BB. Kita masih di sini, masih saling pilih, masih mau berusaha meskipun kadang nggak mudah. Hubungan yang sehat bukan tentang dua orang yang sempurna, tapi dua orang yang mau belajar dan tumbuh bareng. Perlahan, kadang ada mundur, tapi tetap jalan.',
  },
  {
    emoji: '💌', title: 'Always Us',
    text: 'Aku gatau apa yang bakal terjadi di depan, BB. Tapi aku tahu satu hal: aku mau hadapi itu semua bareng BB. Bukan karena aku butuh BB, tapi karena aku pilih BB, yeyeyyyye 🫣🤭, hari demi hari, dalam keadaan apa pun. Love you, BB. Let’s keep going together— you and me, against the world 💗😗',
  },
] as const;

const birthdayLetterPages = [
  {
    title: 'Happy Anniversary, BB',
    paragraphs: [
      'Aku duduk sebentar mikir mau nulis apa, dan akhirnya aku sadar bahwa kata-kata yang paling berarti itu yang paling sederhana. Jadi aku yang imut dan gemas ini memutuskan untuk cuma mau bilang beberapa hal yang ada di hati aku.',
      'Pertama, makasih. Makasih dan makasi bangett udah ada di sisi aku sampai hari ini, BB. Makasih udah temenin aku melewati semua hal, dari yang kecil sampai yang besar. Makasih udah jadi alasan aku senyum lebih sering.',
    ],
  },
  {
    title: 'Thank You for Staying',
    paragraphs: [
      'Makasih udah sabar hadapi mood aku yang naik turun, makasih udah pengertian di saat aku ga bisa jadi pasangan yang sempurna.',
      'Kedua, aku bangga sama kita, BB. Bangga karena kita masih di sini, masih saling pilih, masih mau berusaha meskipun kadang ga mudah.',
    ],
  },
  {
    title: 'Proud of Us',
    paragraphs: [
      'Aku tau ada hari-hari di mana kita berantem karena hal sepele, ada hari-hari di mana kita berdua lelah dan gatau harus gimana. Tapi di semua itu, kita masih di sini. Masih saling peduli. Masih mau berusaha. Dan itu yang bikin aku yakin bahwa kita bisa hadapi apa pun.',
      'Ketiga, aku sadar bahwa hubungan yang sehat itu bukan tentang dua orang yang sempurna, tapi tentang dua orang yang nggak sempurna tapi mau belajar dan tumbuh bareng. Dan aku rasa kita lagi di jalan itu. Perlahan, kadang ada mundur, tapi tetap jalan. Aku ga minta kita jadi pasangan yang sempurna, aku cuma minta kita jadi pasangan yang terus berusaha.',
    ],
  },
  {
    title: 'I Choose You',
    paragraphs: [
      'Aku gatau apa yang bakal terjadi di depan, BB. Tapi aku tahu satu hal: aku mau hadapi itu semua bareng BB. Bukan karena aku butuh BB, tapi karena aku pilih BB dan aku akan terus pilih BB, yeyeyyyye 🫣🤭, hari demi hari, dalam keadaan apa pun.',
      'Kalo dunia lagi baik sama kita, kita nikmatin bareng. Kalo dunia lagi nggak baik, kita hadapi bareng.',
    ],
  },
  {
    title: 'My Favorite Person',
    paragraphs: [
      'Terima kasih udah jadi partner aku, jadi teman aku, jadi alasan aku percaya bahwa cinta yang sehat itu ada. Makasih udah nerima aku apa adanya, dengan semua kekurangan dan kelebihan aku.',
      'Makasih udah jadi rumah buat aku di saat aku butuh tempat buat pulang.',
    ],
  },
  {
    title: 'Always Together',
    paragraphs: [
      'Happy anniversary, BB. Aku selalu ada buat kamu, dan aku mau terus menemani semua hari baik dan hari sulitmu.',
      'Love you, BB. Lebih dari yang kata-kata bisa jelasin. Happy anniversary. Let’s keep going together 💗😗. You and me, against the world.',
    ],
  },
  {
    title: 'A Birthday Wish for You',
    paragraphs: [
      'Semoga sayangku ini selalu diberikan kesehatan dan kelancaraan. Semoga kamu bahagia selalu, panjang umur, dan tetap temenin aku terus ya sayangkuuu.',
      'Makasih juga buat dirimu sendiri yaaa, kamu keren. Intinya aku bangga punya kamu, my love akuuuuu.',
    ],
  },
] as const;
const CATCH_TARGET = 6;

class MelodyPlayer {
  private audio: HTMLAudioElement | null = null;
  private playing = false;
  private trackIndex = 0;

  private loadTrack(trackIndex: number) {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }
    this.trackIndex = trackIndex;
    this.audio = new Audio(musicTracks[trackIndex].src);
    this.audio.loop = true;
    this.audio.volume = 0.7;
  }

  play(trackIndex = this.trackIndex) {
    if (typeof window === 'undefined') return false;
    if (!this.audio || this.trackIndex !== trackIndex) {
      this.loadTrack(trackIndex);
    }
    void this.audio!.play().catch(() => null);
    this.playing = true;
    return true;
  }

  pause() {
    if (this.audio) this.audio.pause();
    this.playing = false;
  }

  toggle(trackIndex: number) {
    if (this.playing) { this.pause(); return false; }
    return this.play(trackIndex);
  }

  sparkle() {
    // sparkle effect — keep audio context for short chime
    if (typeof window === 'undefined') return;
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    [659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const now = ctx.currentTime + index * 0.07;
      const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
      oscillator.type = 'triangle'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.09, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      oscillator.connect(gain).connect(ctx.destination); oscillator.start(now); oscillator.stop(now + 0.32);
    });
  }
}
const melody = new MelodyPlayer();

export default function Home() {
  const [gift, setGift] = useState<GiftData>(readGiftFromUrl);
  const [siteLoading, setSiteLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingLeaving, setLoadingLeaving] = useState(false);
  const [draftGift, setDraftGift] = useState<GiftData>(gift);
  const [stage, setStage] = useState<JourneyStage>('intro');
  const [transitioning, setTransitioning] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [storyPreview, setStoryPreview] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicUnlocked, setMusicUnlocked] = useState(false);
  const [activeTrack, setActiveTrack] = useState(0);
  const [toast, setToast] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [giftOpened, setGiftOpened] = useState(false);
  const [loveProgress, setLoveProgress] = useState(0);
  const [flippedMemories, setFlippedMemories] = useState<number[]>([]);
  const [openEnvelope, setOpenEnvelope] = useState<number | null>(null);
  const [jarHearts, setJarHearts] = useState<number[]>([]);
  const [constellationStep, setConstellationStep] = useState(0);
  const [showConstellationHeart, setShowConstellationHeart] = useState(false);
  const [candleProgress, setCandleProgress] = useState(0);
  const [candleBlown, setCandleBlown] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(8);
  const [timeLeft, setTimeLeft] = useState(40);
  const [playerX, setPlayerX] = useState(50);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [longLetterPage, setLongLetterPage] = useState(0);
  const playerXRef = useRef(playerX);
  const wonRef = useRef(false);
  const loveTimerRef = useRef<number | null>(null);
  const candleTimerRef = useRef<number | null>(null);
  const constellationHeartTimerRef = useRef<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const currentTheme = themes[gift.theme];

  useEffect(() => {
    let current = 0;
    const interval = window.setInterval(() => {
      const step = Math.floor(Math.random() * 10) + 6;
      current = Math.min(100, current + step);
      setLoadingProgress(current);

      if (current >= 100) {
        window.clearInterval(interval);
        window.setTimeout(() => {
          setLoadingLeaving(true);
          window.setTimeout(() => {
            setSiteLoading(false);
          }, 650);
        }, 350);
      }
    }, 95);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => { playerXRef.current = playerX; }, [playerX]);
  useEffect(() => () => {
    melody.pause();
    if (loveTimerRef.current !== null) window.clearInterval(loveTimerRef.current);
    if (candleTimerRef.current !== null) window.clearInterval(candleTimerRef.current);
    if (constellationHeartTimerRef.current !== null) window.clearTimeout(constellationHeartTimerRef.current);
  }, []);
  useEffect(() => {
    document.body.style.overflow = editorOpen || storyPreview || siteLoading ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [editorOpen, storyPreview, siteLoading]);

  useEffect(() => {
    const modal = editorOpen ? editorRef.current : storyPreview ? previewRef.current : null;
    if (!modal) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(modal.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, select, [tabindex]:not([tabindex="-1"])'));
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (editorOpen) setEditorOpen(false);
        if (storyPreview) setStoryPreview(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus?.focus(); };
  }, [editorOpen, storyPreview]);

  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2800); };
  const moveTo = useCallback((next: JourneyStage) => {
    if (transitioning) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage(next); window.scrollTo({ top: 0 }); return;
    }
    setTransitioning(true);
    window.setTimeout(() => { setStage(next); window.scrollTo({ top: 0 }); }, 720);
    window.setTimeout(() => setTransitioning(false), 1500);
  }, [transitioning]);
  const startGame = () => {
    setScore(0); setLives(8); setTimeLeft(40); setPlayerX(50); setFallingItems([]);
    setGiftOpened(false);
    wonRef.current = false; setPlaying(true);
  };
  const unlockGift = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordInput !== gift.password) {
      setPasswordError(true);
      return;
    }
    setPasswordError(false);
    setGiftOpened(false);
    moveTo('gift');
  };
  const addPasswordDigit = (digit: string) => {
    setPasswordInput((value) => `${value}${digit}`.slice(0, 4));
    setPasswordError(false);
  };
  const removePasswordDigit = () => {
    setPasswordInput((value) => value.slice(0, -1));
    setPasswordError(false);
  };
  const returnToStart = () => {
    melody.pause();
    setMusicPlaying(false);
    setMusicUnlocked(false);
    setPlaying(false);
    setFallingItems([]);
    setPasswordInput('');
    setPasswordError(false);
    setGiftOpened(false);
    setLoveProgress(0);
    setFlippedMemories([]);
    setOpenEnvelope(null);
    setLongLetterPage(0);
    setJarHearts([]);
    setConstellationStep(0);
    setShowConstellationHeart(false);
    if (constellationHeartTimerRef.current !== null) window.clearTimeout(constellationHeartTimerRef.current);
    setCandleProgress(0);
    setCandleBlown(false);
    moveTo('intro');
  };
  const movePlayer = useCallback((amount: number) => {
    if (playing) setPlayerX((position) => Math.max(7, Math.min(93, position + amount)));
  }, [playing]);

  useEffect(() => {
    if (stage !== 'game' || !playing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') movePlayer(-9);
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') movePlayer(9);
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [movePlayer, playing, stage]);

  useEffect(() => {
    if (stage !== 'game' || !playing) return;
    const icons = ['♥', '🍓', '🧁', '✦'];
    const spawn = window.setInterval(() => setFallingItems((items) => [...items, {
      id: Date.now() + Math.random(), x: 7 + Math.random() * 86, y: -8, icon: icons[Math.floor(Math.random() * icons.length)],
    }]), 720);
    const fall = window.setInterval(() => {
      setFallingItems((items) => {
        let caught = 0; let missed = 0;
        const next = items.map((item) => ({ ...item, y: item.y + 1.05 })).filter((item) => {
          if (item.y >= 70 && item.y <= 97 && Math.abs(item.x - playerXRef.current) < 22) { caught += 1; return false; }
          if (item.y > 104) { missed += 1; return false; }
          return true;
        });
        if (caught) setScore((value) => Math.min(CATCH_TARGET, value + caught));
        if (missed) setLives((value) => Math.max(0, value - missed));
        return next;
      });
    }, 50);
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => { window.clearInterval(spawn); window.clearInterval(fall); window.clearInterval(timer); };
  }, [playing, stage]);

  const continueToStory = useCallback(() => {
    const started = melody.play(activeTrack);
    setMusicPlaying(started);
    setMusicUnlocked(true);
    moveTo('story');
    setToast(`${musicTracks[activeTrack].title} mulai diputar ♪`);
    window.setTimeout(() => setToast(''), 2800);
  }, [activeTrack, moveTo]);

  useEffect(() => {
    if (!playing) return;
    if (score >= CATCH_TARGET && !wonRef.current) {
      wonRef.current = true;
      const finishWin = window.setTimeout(() => {
        setPlaying(false); setFallingItems([]); melody.sparkle();
        window.setTimeout(continueToStory, 450);
      }, 0);
      return () => window.clearTimeout(finishWin);
    }
    if (lives <= 0 || timeLeft <= 0) {
      const finishGame = window.setTimeout(() => { setPlaying(false); setFallingItems([]); }, 0);
      return () => window.clearTimeout(finishGame);
    }
  }, [continueToStory, lives, playing, score, timeLeft]);

  const copyGiftLink = async (data: GiftData = gift) => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#gift=${encoded}`);
      showToast('Link hadiah berhasil disalin ♥');
    } catch { showToast('Belum bisa menyalin link. Coba lagi, ya.'); }
  };
  const openEditor = () => { setDraftGift(structuredClone(gift)); setEditorOpen(true); };
  const saveEditor = async () => {
    const normalized: GiftData = {
      ...draftGift,
      name: draftGift.name.trim() || defaultGift.name,
      nickname: draftGift.nickname.trim() || draftGift.name.trim() || defaultGift.nickname,
      from: draftGift.from.trim() || defaultGift.from,
      password: normalizeBirthdayPassword(draftGift.password).length === 4 ? normalizeBirthdayPassword(draftGift.password) : defaultGift.password,
      passwordHint: draftGift.passwordHint.trim() || defaultGift.passwordHint,
      intro: draftGift.intro.trim() || defaultGift.intro,
      message: draftGift.message.trim() || defaultGift.message,
      ending: draftGift.ending.trim() || defaultGift.ending,
      wish: draftGift.wish.trim() || defaultGift.wish,
      photos: draftGift.photos.map((photo, index) => ({
        src: safeImageSource(photo.src, defaultGift.photos[index].src),
        caption: photo.caption.trim() || defaultGift.photos[index].caption,
        type: photo.type === 'video' ? 'video' : 'image',
      })),
    };
    setGift(normalized); setDraftGift(normalized); await copyGiftLink(normalized); setEditorOpen(false);
  };
  const toggleMusic = () => {
    const next = melody.toggle(activeTrack);
    setMusicPlaying(next);
    showToast(next ? `${musicTracks[activeTrack].title} diputar ♪` : 'Musik dijeda');
  };
  const selectTrack = (trackIndex: number) => {
    setActiveTrack(trackIndex);
    if (musicPlaying) melody.play(trackIndex);
    showToast(`Sekarang memutar ${musicTracks[trackIndex].title} ♪`);
  };
  const changeTrack = (direction: number) => selectTrack((activeTrack + direction + musicTracks.length) % musicTracks.length);
  const openGift = () => {
    if (giftOpened) return;
    setGiftOpened(true);
    melody.sparkle();
  };
  const acceptBouquet = () => {
    startGame();
    moveTo('game');
  };
  const stopLoveHold = () => {
    if (loveTimerRef.current !== null) {
      window.clearInterval(loveTimerRef.current);
      loveTimerRef.current = null;
    }
  };
  const startLoveHold = () => {
    if (loveProgress >= 100 || loveTimerRef.current !== null) return;
    loveTimerRef.current = window.setInterval(() => {
      setLoveProgress((current) => {
        const next = Math.min(100, current + 2);
        if (next >= 100) {
          if (loveTimerRef.current !== null) window.clearInterval(loveTimerRef.current);
          loveTimerRef.current = null;
          melody.sparkle();
        }
        return next;
      });
    }, 38);
  };
  const flipMemory = (index: number) => {
    setFlippedMemories((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  };
  const collectJarHeart = (index: number) => {
    if (jarHearts.includes(index)) return;
    const next = [...jarHearts, index];
    setJarHearts(next);
    melody.sparkle();
  };
  const connectStar = (index: number) => {
    if (index < constellationStep) return;
    if (index !== constellationStep) {
      showToast('Ikuti bintang yang berkilau dulu ✦');
      return;
    }
    const next = Math.min(5, constellationStep + 1);
    setConstellationStep(next);
    melody.sparkle();
    if (next === 5) {
      setShowConstellationHeart(true);
      if (constellationHeartTimerRef.current !== null) {
        window.clearTimeout(constellationHeartTimerRef.current);
      }
      constellationHeartTimerRef.current = window.setTimeout(() => {
        setShowConstellationHeart(false);
      }, 3600);
    }
  };
  const stopCandleHold = (reset = true) => {
    if (candleTimerRef.current !== null) {
      window.clearInterval(candleTimerRef.current);
      candleTimerRef.current = null;
    }
    if (reset) setCandleProgress((current) => current >= 100 ? current : 0);
  };
  const startCandleHold = () => {
    if (candleBlown || candleTimerRef.current !== null) return;
    candleTimerRef.current = window.setInterval(() => {
      setCandleProgress((current) => {
        const next = Math.min(100, current + 4);
        if (next >= 100) {
          if (candleTimerRef.current !== null) window.clearInterval(candleTimerRef.current);
          candleTimerRef.current = null;
          setCandleBlown(true);
          melody.sparkle();
        }
        return next;
      });
    }, 45);
  };
  const themeStyle = { '--accent': currentTheme.accent, '--soft': currentTheme.soft, '--ink': currentTheme.ink, '--glow': currentTheme.glow } as React.CSSProperties;
  const ambient = useMemo(() => floatingMotifs.map((motif) => (
    <span className="ambient-motif" key={motif.id} style={{ left: motif.left, top: motif.top, animationDelay: motif.delay }}>{motif.icon}</span>
  )), []);

  const loadingCaption = useMemo(() => {
    if (loadingProgress < 25) return 'Membuka lembaran kejutan...';
    if (loadingProgress < 55) return `Merapikan bunga untuk ${gift.nickname}...`;
    if (loadingProgress < 85) return 'Menyusun kenangan & melodi manis...';
    if (loadingProgress < 100) return 'Sedikit lagi...';
    return 'Semua sudah siap! ♥';
  }, [loadingProgress, gift.nickname]);

  return (
    <main className={`journey-root theme-${gift.theme}${stage === 'story' ? ' stage-story' : ''}`} style={themeStyle}>
      {siteLoading && (
        <div
          className={`site-buffering-screen ${loadingLeaving ? 'leaving' : ''}`}
          role="status"
          aria-label="Memuat kejutan ulang tahun"
          aria-live="polite"
        >
          <div className="buffering-backdrop-glow" aria-hidden="true" />
          <div className="buffering-ambient" aria-hidden="true">{ambient}</div>
          <div className="buffering-content">
            <div className="buffering-icon-wrap">
              <span className="buffering-halo" aria-hidden="true" />
              <img
                src="/customer/bouquet.png"
                alt=""
                className="buffering-bouquet"
                decoding="async"
              />
              <span className="buffering-heart-pulse" aria-hidden="true">♥</span>
            </div>
            <div className="buffering-text-wrap">
              <span className="buffering-eyebrow">A Special Surprise for {gift.name}</span>
              <h2 className="buffering-title">Menyiapkan Hadiahmu</h2>
              <p className="buffering-caption">{loadingCaption}</p>
            </div>
            <div className="buffering-progress-container">
              <div className="buffering-bar-track">
                <div
                  className="buffering-bar-fill"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="buffering-bar-info">
                <span>MEMUAT KEJUTAN</span>
                <strong>{loadingProgress}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="journey-toast" role="status">{toast}</div>}
      <div className={`flower-curtain ${transitioning ? 'active' : ''}`} aria-hidden="true">
        <div className="flower-transition-backdrop" />
        {transitionFlowers.map((flower) => (
          <span
            className="transition-bloom"
            key={flower.id}
            style={{
              '--flower-x': flower.x,
              '--flower-y': flower.y,
              '--flower-rotation': flower.rotation,
              '--flower-scale': flower.scale,
              '--flower-delay': flower.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>
      <header className="journey-controls">
        {stage !== 'intro' ? <button className="round-control" onClick={returnToStart} aria-label="Kembali ke awal">←</button> : <span className="tiny-brand">made for you ♥</span>}
        {stage !== 'intro' && <div><button className="soft-control" onClick={openEditor}>Edit hadiah</button></div>}
      </header>

      {musicUnlocked && (
        <aside className="music-dock" aria-label="Pemutar musik hadiah">
          <button className="music-skip" onClick={() => changeTrack(-1)} aria-label="Lagu sebelumnya">‹</button>
          <button className={`music-toggle ${musicPlaying ? 'playing' : ''}`} onClick={toggleMusic} aria-label={musicPlaying ? 'Jeda musik' : 'Putar musik'}>{musicPlaying ? 'Ⅱ' : '▶'}</button>
          <div className="music-copy"><span>{musicPlaying ? 'now playing' : 'music paused'}</span><strong>{musicTracks[activeTrack].title}</strong><small>{musicTracks[activeTrack].mood}</small></div>
          <button className="music-skip" onClick={() => changeTrack(1)} aria-label="Lagu berikutnya">›</button>
          <div className="music-track-dots" aria-label="Pilih musik">{musicTracks.map((track, index) => <button className={activeTrack === index ? 'active' : ''} onClick={() => selectTrack(index)} key={track.title} aria-label={`Putar ${track.title}`} aria-pressed={activeTrack === index} />)}</div>
        </aside>
      )}

      {stage === 'intro' && (
        <section className="intro-stage stage-screen">
          {ambient}
          <div className="intro-copy"><span className="eyebrow">A private little surprise for</span><h1>{gift.name}<em>♥</em></h1><p>{gift.intro}</p>
            <form className={`password-gate ${passwordError ? 'has-error' : ''}`} onSubmit={unlockGift}>
              <div className="birthday-lock-heading"><span aria-hidden="true">♡</span><div><strong>Birthday password</strong><small>Masukkan tanggal ulang tahunmu</small></div></div>
              <div className="birthday-code" aria-label={`${passwordInput.length} dari 4 angka terisi`} aria-live="polite">
                {Array.from({ length: 4 }, (_, index) => <span className={passwordInput[index] ? 'filled' : ''} key={index}>{passwordInput[index] ?? '·'}</span>)}
              </div>
              <div className="birthday-keypad" aria-label="Keypad tanggal ulang tahun">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => <button type="button" key={digit} onClick={() => addPasswordDigit(String(digit))} aria-label={`Angka ${digit}`}>{digit}</button>)}
                <button type="button" className="keypad-delete" onClick={removePasswordDigit} disabled={!passwordInput} aria-label="Hapus angka terakhir">⌫</button>
                <button type="button" onClick={() => addPasswordDigit('0')} aria-label="Angka 0">0</button>
                <button type="submit" className="keypad-enter" disabled={passwordInput.length !== 4} aria-label="Buka kejutan">♥</button>
              </div>
              <p id="password-hint" className="password-hint"><span>Hint</span> {gift.passwordHint}</p>
              <p id="password-error" className="password-error" role="alert" aria-live="polite">{passwordError ? 'Belum tepat. Coba ingat petunjuknya, ya ♥' : '\u00a0'}</p>
            </form>
          </div>
          <div className="intro-visual"><div className="bouquet-halo" /><img src="/customer/bouquet.png" alt="Buket ulang tahun untuk penerima" fetchPriority="high" decoding="async" /><span className="hand-note">picked just for you</span></div>
          <div className="scroll-cue">only the right person can enter</div>
        </section>
      )}

      {stage === 'game' && (
        <section className="game-stage stage-screen" onPointerMove={(event) => { if (!playing) return; const rect = event.currentTarget.getBoundingClientRect(); setPlayerX(Math.max(7, Math.min(93, ((event.clientX - rect.left) / rect.width) * 100))); }}>
          <div className="game-hud" aria-live="polite"><p>Bantu Momo mengumpulkan bunga untuk cerita {gift.nickname}</p><div><span>♥ {score}/{CATCH_TARGET}</span><span>♡ {lives}</span><span>{timeLeft}s</span></div></div>
          {fallingItems.map((item) => <span aria-hidden="true" className={`journey-falling-item ${item.icon === '♥' ? 'heart' : ''}`} key={item.id} style={{ left: `${item.x}%`, top: `${item.y}%` }}>{item.icon}</span>)}
          <div className="catcher" style={{ left: `${playerX}%` }}><img src="/journey/otter-catcher.webp" alt="Momo si berang-berang membawa keranjang" decoding="async" /></div>
          {!playing && score < CATCH_TARGET && <div className="game-start-card"><span>{lives <= 0 || timeLeft <= 0 ? 'almost!' : 'mini game'}</span><h2>{lives <= 0 || timeLeft <= 0 ? 'Coba sekali lagi?' : 'Catch the sweet things'}</h2><p>Geser Momo langsung di layar atau pakai tombol. Tangkap {CATCH_TARGET} hadiah—area tangkapnya sudah dibuat lebih ramah di mobile.</p><div className="game-card-actions"><button className="journey-cta" onClick={startGame}>{lives <= 0 || timeLeft <= 0 ? 'Main lagi ↻' : 'Mulai main →'}</button><button className="skip-game" onClick={continueToStory}>Lanjut ke cerita</button></div></div>}
          <div className="game-move-controls"><button onClick={() => movePlayer(-10)} disabled={!playing} aria-label="Gerak ke kiri">←</button><span>geser di layar · A / D</span><button onClick={() => movePlayer(10)} disabled={!playing} aria-label="Gerak ke kanan">→</button></div>
        </section>
      )}

      {stage === 'gift' && (
        <section className={`gift-stage stage-screen ${giftOpened ? 'gift-opened' : ''}`}>
          <div className="sky-sparkles">{ambient}</div>
          {giftOpened && (
            <div className="wish-confetti gift-confetti" aria-hidden="true">
              {Array.from({ length: 48 }, (_, index) => (
                <span
                  key={index}
                  style={{
                    '--confetti-x': `${((index * 41) % 111) - 55}vw`,
                    '--confetti-y': `${14 + ((index * 23) % 54)}vh`,
                    '--confetti-rotate': `${180 + ((index * 67) % 540)}deg`,
                    '--confetti-delay': `${(index % 12) * 0.035}s`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          )}
          <div className="gift-reveal">
            <span className="eyebrow">you did it, {gift.nickname}!</span>
            <h2>{giftOpened ? <>A bouquet <em>just for you.</em></> : <>A little gift <em>for you.</em></>}</h2>
            <div className="gift-box-scene">
              <img className="gift-bouquet" src="/customer/bouquet.png" alt={giftOpened ? 'Buket bunga muncul dari kotak hadiah' : ''} decoding="async" />
              <button className="gift-box" type="button" onClick={openGift} disabled={giftOpened} aria-label="Buka kotak hadiah" aria-expanded={giftOpened}>
                <span className="gift-box-lid" aria-hidden="true"><i /></span>
                <span className="gift-box-body" aria-hidden="true"><i /></span>
                {!giftOpened && <strong>Buka hadiah</strong>}
              </button>
            </div>
            <div className="gift-reveal-copy" aria-live="polite">
              {giftOpened
                ? <><p>Setiap bunga membawa satu doa baik untuk tahun barumu.</p><button className="journey-cta" onClick={acceptBouquet}>Terima buketnya →</button></>
                : <p>Ketuk kotaknya untuk melihat kejutanmu.</p>}
            </div>
          </div>
        </section>
      )}

      {stage === 'story' && (
        <div className="story-stage"><div className="story-ambient" aria-hidden="true">{ambient}</div>
          <section className="story-hero story-section"><span className="eyebrow">for your birthday & anniversary</span><h1>Happy Birthday<br />& Anniversary,<br /><em>{gift.nickname}.</em></h1><p>Masih ada beberapa kejutan kecil dari {gift.from}. Geser sekali untuk lanjut, ya.</p><span className="story-scroll-cue" aria-hidden="true">↓</span></section>

          <section className="petal-story story-section">
            {loveProgress >= 100 && (
              <div className="wish-confetti love-confetti" aria-hidden="true">
                {Array.from({ length: 32 }, (_, index) => (
                  <span
                    key={index}
                    style={{
                      '--confetti-x': `${((index * 37) % 101) - 50}vw`,
                      '--confetti-y': `${38 + ((index * 29) % 34)}vh`,
                      '--confetti-rotate': `${180 + ((index * 73) % 540)}deg`,
                      '--confetti-delay': `${(index % 8) * 0.045}s`,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
            )}
            <div className="interactive-heading"><span className="eyebrow">01 · fill my heart</span><h2>Sebelum lanjut,<br />seberapa penuh hatimu?</h2><p>Tahan hatinya sampai penuh. Jangan dilepas dulu, ya.</p></div>
            <div className={`love-meter-scene ${loveProgress >= 100 ? 'complete' : ''}`} style={{ '--love-progress': `${loveProgress}%` } as React.CSSProperties}>
              <img src="/customer/bouquet.png" alt={`Buket dari ${gift.from} untuk ${gift.name}`} loading="lazy" decoding="async" />
              <div className="love-percentage" aria-live="polite"><strong>{loveProgress}%</strong><span>{loveProgress >= 100 ? 'You filled my heart ♥' : loveProgress >= 75 ? 'Sedikit lagi...' : loveProgress >= 40 ? 'Makin penuh...' : 'Tahan terus'}</span></div>
              <button className="love-heart-hold" onPointerDown={startLoveHold} onPointerUp={stopLoveHold} onPointerLeave={stopLoveHold} onPointerCancel={stopLoveHold} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') startLoveHold(); }} onKeyUp={(event) => { if (event.key === 'Enter' || event.key === ' ') stopLoveHold(); }} disabled={loveProgress >= 100} aria-label="Tahan hati sampai seratus persen"><span className="love-heart-shape" aria-hidden="true">♥</span></button>
            </div>
            <div className={`petal-message ${loveProgress >= 100 ? 'complete' : ''}`} aria-live="polite"><span>{loveProgress >= 100 ? '100% FOR YOU' : 'HOLD THE HEART'}</span><p>{loveProgress >= 100 ? `Aku suka caramu membuat hal sederhana terasa istimewa, ${gift.nickname}. Semua bunga ini untukmu.` : `Isi hatinya untuk membuka pesan kecil dari ${gift.from}.`}</p></div>
          </section>

          <section className="memory-play bb-memories story-section">
            <div className="interactive-heading"><span className="eyebrow">02 · our little memories</span><h2>Tiga foto, satu video, banyak rasa.</h2><p>Putar videonya langsung, atau balik tiap kenangan untuk membaca pesannya.</p></div>
            <div className="polaroid-deck">{gift.photos.map((photo, index) => <div className={`flip-polaroid polaroid-${index + 1} ${flippedMemories.includes(index) ? 'flipped' : ''}`} key={index} role="group" tabIndex={0} aria-label={`Kenangan ${index + 1}. Ketuk polaroid untuk membalik.`} onClick={(event) => { if ((event.target as HTMLElement).closest('video, button')) return; flipMemory(index); }} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); flipMemory(index); } }}>
              <span className="polaroid-inner">
                <span className="polaroid-front">
                  {photo.type === 'video'
                    ? <video className="polaroid-video" src={photo.src} poster="/customer/photos/bb-03.jpeg" controls playsInline preload="metadata" aria-label={photo.caption} onClick={(event) => event.stopPropagation()} />
                    : <img src={photo.src} alt={`Kenangan ${index + 1} ${gift.nickname} dan ${gift.from}`} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = defaultGift.photos[index].src; }} />}
                  <button type="button" className="polaroid-turn-button" onClick={(event) => { event.stopPropagation(); flipMemory(index); }} aria-label={`Balik kenangan ${index + 1}`}>ketuk untuk membaca ↻</button>
                </span>
                <span className="polaroid-back"><span>FOR {gift.nickname}</span><p>{photo.caption}</p><small>— {gift.from}</small><button type="button" className="polaroid-turn-button" onClick={(event) => { event.stopPropagation(); flipMemory(index); }} aria-label={`Kembali ke kenangan ${index + 1}`}>lihat kenangan ↻</button></span>
              </span>
            </div>)}</div>
          </section>

          <section className="envelope-story story-section">
            <div className="interactive-heading"><span className="eyebrow">03 · three little letters</span><h2>Ada tiga amplop untukmu.</h2><p>Buka satu per satu—setiap emoji menyimpan sisi berbeda dari cerita kalian.</p></div>
            <div className="envelope-row three-envelopes">{envelopeLetters.map((letter, index) => <button className={`love-envelope ${openEnvelope === index ? 'open' : ''}`} key={letter.title} onClick={() => { setOpenEnvelope(index); melody.sparkle(); }} aria-expanded={openEnvelope === index}><span className="envelope-icon envelope-emoji" aria-hidden="true">{letter.emoji}</span><strong>{letter.title}</strong><small>{openEnvelope === index ? 'sudah dibuka' : 'ketuk amplop'}</small></button>)}</div>
            <div key={openEnvelope ?? 'closed'} className={`envelope-letter ${openEnvelope !== null ? 'visible' : ''}`} aria-live="polite">{openEnvelope !== null && <><button className="envelope-close" type="button" onClick={() => setOpenEnvelope(null)} aria-label="Tutup surat">×</button><span>Dear {gift.nickname},</span><p>“{envelopeLetters[openEnvelope].text}”</p><small>with all my love, {gift.from}</small></>}</div>
          </section>

          <section className="long-letter-story story-section">
            <div className="interactive-heading"><span className="eyebrow">04 · read me slowly</span><h2>Surat panjang dari {gift.from}.</h2><p>Nggak perlu buru-buru. Tujuh halaman kecil ini dibuat supaya setiap kata tetap nyaman dibaca.</p></div>
            <article className="long-letter-card" aria-live="polite">
              <span className="letter-page-number">{String(longLetterPage + 1).padStart(2, '0')} / {String(birthdayLetterPages.length).padStart(2, '0')}</span>
              <h3>{birthdayLetterPages[longLetterPage].title}</h3>
              <div>{birthdayLetterPages[longLetterPage].paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
              <small>always yours, {gift.from}</small>
            </article>
            <div className="long-letter-nav">
              <button type="button" onClick={() => setLongLetterPage((page) => Math.max(0, page - 1))} disabled={longLetterPage === 0}>← Sebelumnya</button>
              <div aria-label="Halaman surat">{birthdayLetterPages.map((page, index) => <button type="button" key={page.title} className={longLetterPage === index ? 'active' : ''} onClick={() => setLongLetterPage(index)} aria-label={`Buka halaman ${index + 1}`} />)}</div>
              <button type="button" onClick={() => setLongLetterPage((page) => Math.min(birthdayLetterPages.length - 1, page + 1))} disabled={longLetterPage === birthdayLetterPages.length - 1}>Berikutnya →</button>
            </div>
          </section>

          <section className="jar-story story-section">
            <div className="interactive-heading"><span className="eyebrow">05 · collect my love</span><h2>Tangkap lima hati kecil.</h2><p>Ketuk satu per satu dan simpan semuanya di dalam love jar.</p></div>
            <div className={`love-jar-game ${jarHearts.length === 5 ? 'complete' : ''}`}>
              <img src="/interactives/love-jar.png" alt="Love jar untuk mengumpulkan hati" loading="lazy" decoding="async" />
              {[0, 1, 2, 3, 4].map((heart) => <button key={heart} className={`jar-heart jar-heart-${heart + 1} ${jarHearts.includes(heart) ? 'collected' : ''}`} type="button" onClick={() => collectJarHeart(heart)} disabled={jarHearts.includes(heart)} aria-label={`Masukkan hati ${heart + 1} ke love jar`}>♥</button>)}
              <div className="jar-fill" aria-hidden="true">{jarHearts.map((heart) => <span key={heart}>♥</span>)}</div>
              <div className="jar-counter" aria-live="polite"><strong>{jarHearts.length}/5</strong><span>{jarHearts.length === 5 ? 'penuh untukmu' : 'hati terkumpul'}</span></div>
            </div>
            <p className={`interactive-reveal ${jarHearts.length === 5 ? 'visible' : ''}`} aria-live="polite">Semua rasa kecil dari {gift.from} sudah terkumpul untuk {gift.nickname}. ♥</p>
          </section>

          <section className="constellation-story story-section">
            <div className="interactive-heading"><span className="eyebrow">06 · a secret in the sky</span><h2>Tulis nama kita di langit.</h2><p>Sentuh bintang yang berkilau. Setiap titik menyimpan satu kata dari {gift.from}.</p></div>
            <div className={`constellation-game step-${constellationStep} ${constellationStep === 5 ? 'complete' : ''}`}>
              <img src="/interactives/constellation-sky.png" alt="Langit malam untuk permainan konstelasi" loading="lazy" decoding="async" />
              <div className={`constellation-heart-mark ${showConstellationHeart ? 'visible' : ''}`} aria-hidden="true">♡</div>
              <div className="shooting-stars" aria-hidden="true"><span /><span /><span /></div>
              <svg className="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {[[17, 68, 34, 35], [34, 35, 54, 62], [54, 62, 71, 27], [71, 27, 87, 55]].map(([x1, y1, x2, y2], line) => <line key={line} className={constellationStep > line + 1 ? 'active' : ''} x1={x1} y1={y1} x2={x2} y2={y2} pathLength="1" />)}
              </svg>
              {['Aku', 'memilih', 'kamu', 'hari ini', 'dan seterusnya'].map((word, star) => <button key={word} className={`star-node star-node-${star + 1} ${star < constellationStep ? 'connected' : ''} ${star === constellationStep ? 'next' : ''}`} type="button" onClick={() => connectStar(star)} aria-label={`Bintang ${star + 1}${star === constellationStep ? ', pilih berikutnya' : ''}`}><span aria-hidden="true">✦</span><small aria-hidden="true">{word}</small></button>)}
              <div className="constellation-result" aria-live="polite"><strong>{constellationStep === 5 ? `${gift.from.trim().charAt(0).toUpperCase()} ✦ ${gift.nickname.trim().charAt(0).toUpperCase()}` : `${constellationStep}/5`}</strong><span>{constellationStep === 5 ? `${gift.from} & ${gift.nickname}` : 'kata ditemukan'}</span></div>
              <p className="constellation-secret" aria-live="polite">{constellationStep === 0 ? 'Temukan pesan rahasianya ✦' : ['Aku', 'Aku memilih', 'Aku memilih kamu', 'Aku memilih kamu hari ini', `Aku memilih kamu hari ini dan seterusnya, ${gift.nickname}.`][constellationStep - 1]}</p>
            </div>
          </section>

          <section className={`candle-story story-section ${candleBlown ? 'wish-made' : ''}`}>
            {candleBlown && <div className="wish-confetti" aria-hidden="true">{Array.from({ length: 32 }, (_, index) => <span key={index} style={{ '--confetti-x': `${((index * 37) % 101) - 50}vw`, '--confetti-y': `${38 + ((index * 29) % 34)}vh`, '--confetti-rotate': `${180 + ((index * 73) % 540)}deg`, '--confetti-delay': `${(index % 8) * 0.045}s` } as React.CSSProperties} />)}</div>}
            <div className="interactive-heading"><span className="eyebrow">07 · make a wish</span><h2>{candleBlown ? 'Doamu sudah terbang ✦' : 'Tutup mata, lalu buat harapan.'}</h2><p>{candleBlown ? 'Semoga semesta mendengar semuanya.' : 'Tahan tombol lilinnya sampai apinya padam.'}</p></div>
            <div className="birthday-cake" aria-hidden="true"><span className="cake-flame" /><span className="cake-candle" /><span className="cake-top">♡ · ♡ · ♡</span><span className="cake-layer cake-layer-one" /><span className="cake-layer cake-layer-two" /></div>
            <button className="candle-hold" style={{ '--wish-progress': `${candleProgress}%` } as React.CSSProperties} onPointerDown={startCandleHold} onPointerUp={() => stopCandleHold()} onPointerLeave={() => stopCandleHold()} onPointerCancel={() => stopCandleHold()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') startCandleHold(); }} onKeyUp={(event) => { if (event.key === 'Enter' || event.key === ' ') stopCandleHold(); }} disabled={candleBlown} aria-label="Tahan untuk meniup lilin"><span>{candleBlown ? '✓' : '♥'}</span><strong>{candleBlown ? 'Harapan terkirim' : 'Tahan di sini'}</strong></button>
            {candleBlown && <div className="final-wish"><p>{gift.ending}</p><blockquote>“{gift.wish}”</blockquote><span>— {gift.from}</span></div>}
            {candleBlown && <div className="ending-actions"><button onClick={() => setStoryPreview(true)}>Preview untuk Story</button><button onClick={() => copyGiftLink()}>Salin link hadiah</button><button onClick={returnToStart}>Ulangi dari awal</button></div>}
          </section>
        </div>
      )}

      {editorOpen && <div className="journey-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}><div ref={editorRef} className="journey-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title"><div className="editor-heading"><div><span className="eyebrow">personalize it</span><h2 id="editor-title">Edit hadiahmu</h2></div><button onClick={() => setEditorOpen(false)} aria-label="Tutup editor">×</button></div><div className="editor-grid"><label>Nama penerima<input value={draftGift.name} maxLength={40} onChange={(event) => setDraftGift({ ...draftGift, name: event.target.value })} /></label><label>Nama panggilan<input value={draftGift.nickname} maxLength={24} onChange={(event) => setDraftGift({ ...draftGift, nickname: event.target.value })} /></label><label>Nama pengirim<input value={draftGift.from} maxLength={40} onChange={(event) => setDraftGift({ ...draftGift, from: event.target.value })} /></label><label>Tema<select value={draftGift.theme} onChange={(event) => setDraftGift({ ...draftGift, theme: event.target.value as ThemeId })}>{(Object.keys(themes) as ThemeId[]).map((theme) => <option key={theme} value={theme}>{themes[theme].name}</option>)}</select></label><label>Password pembuka<input value={draftGift.password} maxLength={60} autoComplete="off" onChange={(event) => setDraftGift({ ...draftGift, password: event.target.value })} /></label><label>Hint password<input value={draftGift.passwordHint} maxLength={120} onChange={(event) => setDraftGift({ ...draftGift, passwordHint: event.target.value })} /></label></div><label>Kalimat pembuka<textarea rows={2} value={draftGift.intro} maxLength={180} onChange={(event) => setDraftGift({ ...draftGift, intro: event.target.value })} /></label><label>Pesan utama<textarea rows={5} value={draftGift.message} maxLength={900} onChange={(event) => setDraftGift({ ...draftGift, message: event.target.value })} /></label><label>Pesan penutup<textarea rows={3} value={draftGift.ending} maxLength={360} onChange={(event) => setDraftGift({ ...draftGift, ending: event.target.value })} /></label><label>Doa rahasia<textarea rows={3} value={draftGift.wish} maxLength={360} onChange={(event) => setDraftGift({ ...draftGift, wish: event.target.value })} /></label><fieldset className="photo-editor"><legend>Foto & caption kenangan</legend><p>Gunakan link gambar publik agar fotonya ikut terbuka saat link hadiah dibagikan.</p>{draftGift.photos.map((photo, index) => <div className="photo-editor-row" key={index}><span>0{index + 1}</span><label>Link foto<input type="url" inputMode="url" value={photo.src} onChange={(event) => setDraftGift({ ...draftGift, photos: draftGift.photos.map((item, photoIndex) => photoIndex === index ? { ...item, src: event.target.value } : item) })} /></label><label>Caption<input value={photo.caption} maxLength={120} onChange={(event) => setDraftGift({ ...draftGift, photos: draftGift.photos.map((item, photoIndex) => photoIndex === index ? { ...item, caption: event.target.value } : item) })} /></label></div>)}</fieldset><div className="editor-actions"><button className="cancel-editor" onClick={() => setEditorOpen(false)}>Batal</button><button className="journey-cta" onClick={saveEditor}>Simpan & salin link →</button></div></div></div>}

      {storyPreview && <div className="journey-modal-backdrop story-preview-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setStoryPreview(false); }}><div ref={previewRef} className="story-preview-wrap" role="dialog" aria-modal="true" aria-label="Preview hadiah untuk Story"><button className="preview-close" onClick={() => setStoryPreview(false)} aria-label="Tutup preview">×</button><div className="story-poster"><span>UNTUK YANG TERSAYANG</span><h2>{gift.name}</h2><img src={gift.photos[0].src} alt={gift.photos[0].caption} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = defaultGift.photos[0].src; }} /><div className="poster-heart">♥</div><p>Dari {gift.from}</p></div><button className="journey-cta full" onClick={() => copyGiftLink()}>Bagikan link hadiah →</button></div></div>}
    </main>
  );
}
