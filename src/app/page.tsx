"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

// Types
type CategoryId = "nutrition" | "sleep" | "growth" | "vaccines" | "activity";

interface FeedItem {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  completed: boolean;
}

interface Metrics {
  metric1: string;
  metric2: string;
}

interface CategoryConfig {
  id: CategoryId;
  label: string;
  emoji: string;
  heroTitle: string;
  heroDesc: string;
  metric1Label: string;
  metric2Label: string;
  alertText: string;
  defaultMetric1: string;
  defaultMetric2: string;
}

// Category configuration
const CATEGORIES: CategoryConfig[] = [
  {
    id: "nutrition",
    label: "Nutrition",
    emoji: "🥑",
    heroTitle: "Avocado solid introduction",
    heroDesc: "Rich in healthy fats and fiber. Introduce in small spoonfuls to monitor texture tolerance.",
    metric1Label: "PORTION",
    metric2Label: "TEXTURE",
    alertText: "⚠️ Avoid honey or added sugar for baby food under 12 months.",
    defaultMetric1: "150 ml",
    defaultMetric2: "Puréed"
  },
  {
    id: "sleep",
    label: "Sleep",
    emoji: "🌙",
    heroTitle: "Leo's Nap Schedule",
    heroDesc: " Leo is currently transitioning to a 2-nap routine. Maintain a 3-hour wake window before bed.",
    metric1Label: "TOTAL SLEEP",
    metric2Label: "NIGHT SLEEP",
    alertText: "💡 Keep the nursery room temperature between 20-22°C (68-72°F) for safe sleep.",
    defaultMetric1: "13.5 Hours",
    defaultMetric2: "10.5 Hours"
  },
  {
    id: "growth",
    label: "Growth",
    emoji: "📈",
    heroTitle: "Development & Percentiles",
    heroDesc: "Leo is tracking in the 75th percentile for height. Neck control and crawling support look strong.",
    metric1Label: "WEIGHT",
    metric2Label: "HEIGHT",
    alertText: "⭐ Leo is starting to pull-to-stand. Anchor heavy dressers and tables.",
    defaultMetric1: "8.4 kg",
    defaultMetric2: "71.2 cm"
  },
  {
    id: "vaccines",
    label: "Vaccines",
    emoji: "🛡️",
    heroTitle: "Pediatric Immunizations",
    heroDesc: "Leo completed his 6-month immunization series. Next checkup is scheduled for 9 months.",
    metric1Label: "LAST DOSE",
    metric2Label: "NEXT DUE",
    alertText: "🩺 Mild fever up to 38.5°C is common post-vaccine. Apply a cool, damp cloth.",
    defaultMetric1: "DTaP-HepB #3",
    defaultMetric2: "Measles (9m)"
  },
  {
    id: "activity",
    label: "Activity",
    emoji: "🎨",
    heroTitle: "Sensory & Motor Skills",
    heroDesc: "Focus on hand-eye coordination with blocks and sorting cups. Ensure daily tummy time.",
    metric1Label: "SENSORY",
    metric2Label: "OUTDOOR",
    alertText: "🧸 Avoid toys with parts smaller than 3cm to prevent choking hazards.",
    defaultMetric1: "45 Mins",
    defaultMetric2: "30 Mins"
  }
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("nutrition");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Category metrics state
  const [metricsData, setMetricsData] = useState<Record<CategoryId, Metrics>>({
    nutrition: { metric1: "150 ml", metric2: "Puréed" },
    sleep: { metric1: "13.5 Hours", metric2: "10.5 Hours" },
    growth: { metric1: "8.4 kg", metric2: "71.2 cm" },
    vaccines: { metric1: "DTaP-HepB #3", metric2: "Measles (9m)" },
    activity: { metric1: "45 Mins", metric2: "30 Mins" }
  });

  // Secondary Feed items state
  const [feedItems, setFeedItems] = useState<Record<CategoryId, FeedItem[]>>({
    nutrition: [
      { id: "nut-1", title: "Morning Milk Feed", subtitle: "8:00 AM • Breastmilk (180ml)", emoji: "🍼", completed: true },
      { id: "nut-2", title: "Avocado Mash Lunch", subtitle: "12:30 PM • Solid feeding test", emoji: "🥑", completed: false },
      { id: "nut-3", title: "Water Hydration Check", subtitle: "4:00 PM • Small training cup", emoji: "💧", completed: false }
    ],
    sleep: [
      { id: "slp-1", title: "Morning Nap (1.5h)", subtitle: "9:30 AM - 11:00 AM • Peaceful", emoji: "💤", completed: true },
      { id: "slp-2", title: "Afternoon Nap (1.2h)", subtitle: "2:30 PM - 3:45 PM • Restless", emoji: "🛌", completed: true },
      { id: "slp-3", title: "Wind-down Bedtime", subtitle: "7:30 PM • White noise active", emoji: "🌌", completed: false }
    ],
    growth: [
      { id: "grw-1", title: "Length Measurement", subtitle: "Pediatric clinic records • 71.2 cm", emoji: "📏", completed: true },
      { id: "grw-2", title: "Tummy Time Session", subtitle: "10:30 AM • 20 minutes active play", emoji: "👶", completed: true },
      { id: "grw-3", title: "Weight Check-in", subtitle: "Home infant scale • 8.4 kg", emoji: "⚖️", completed: false }
    ],
    vaccines: [
      { id: "vac-1", title: "DTaP-HepB-IPV #3", subtitle: "Administered on May 12 • Left thigh", emoji: "💉", completed: true },
      { id: "vac-2", title: "Rotavirus Oral Dose 3", subtitle: "Administered on May 12 • Completed", emoji: "💧", completed: true },
      { id: "vac-3", title: "Influenza Booster", subtitle: "Scheduled for early autumn booster", emoji: "🗓️", completed: false }
    ],
    activity: [
      { id: "act-1", title: "Stroller Walk in Park", subtitle: "3:30 PM • 30 mins outdoors", emoji: "🌳", completed: true },
      { id: "act-2", title: "Stacking Blocks Play", subtitle: "11:15 AM • Motor coordination", emoji: "🧱", completed: true },
      { id: "act-3", title: "Mirror Self Recognition", subtitle: "6:00 PM • Cognitive recognition", emoji: "🪞", completed: false }
    ]
  });

  // Form states for Modal
  const [formCategory, setFormCategory] = useState<CategoryId>("nutrition");
  const [formTitle, setFormTitle] = useState("");
  const [formMetric1, setFormMetric1] = useState("");
  const [formMetric2, setFormMetric2] = useState("");
  const [formNote, setFormNote] = useState("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll category active pill into view when switched
  useEffect(() => {
    const activeBtn = document.getElementById(`cat-btn-${activeCategory}`);
    if (activeBtn && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const containerScrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const btnOffsetLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.clientWidth;

      // Centered snap scroll calculation
      const targetScroll = btnOffsetLeft - (containerWidth / 2) + (btnWidth / 2);
      container.scrollTo({
        left: targetScroll,
        behavior: "smooth"
      });
    }
  }, [activeCategory]);

  const toggleFeedItem = (categoryId: CategoryId, itemId: string) => {
    setFeedItems(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  const handleOpenModal = () => {
    setFormCategory(activeCategory);
    setFormTitle("");
    
    // Set placeholder metrics to correspond with category
    const currentCat = CATEGORIES.find(c => c.id === activeCategory);
    setFormMetric1(currentCat?.defaultMetric1 || "");
    setFormMetric2(currentCat?.defaultMetric2 || "");
    setFormNote("");
    setIsModalOpen(true);
  };

  // Switch placeholder values dynamically when changing category inside form
  const handleFormCategoryChange = (catId: CategoryId) => {
    setFormCategory(catId);
    const selectedCat = CATEGORIES.find(c => c.id === catId);
    setFormMetric1(selectedCat?.defaultMetric1 || "");
    setFormMetric2(selectedCat?.defaultMetric2 || "");
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    // 1. Create new feed item
    const currentCat = CATEGORIES.find(c => c.id === formCategory);
    const newFeedItem: FeedItem = {
      id: `${formCategory}-${Date.now()}`,
      title: formTitle,
      subtitle: `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${formNote || "Manual entry"}`,
      emoji: currentCat?.emoji || "📝",
      completed: false
    };

    // 2. Append new feed item to target category
    setFeedItems(prev => ({
      ...prev,
      [formCategory]: [newFeedItem, ...prev[formCategory]]
    }));

    // 3. Update main metrics for that category
    if (formMetric1.trim() || formMetric2.trim()) {
      setMetricsData(prev => ({
        ...prev,
        [formCategory]: {
          metric1: formMetric1.trim() || prev[formCategory].metric1,
          metric2: formMetric2.trim() || prev[formCategory].metric2
        }
      }));
    }

    // 4. Close modal and set active view to logged category
    setIsModalOpen(false);
    setActiveCategory(formCategory);
  };

  const currentCategoryConfig = CATEGORIES.find(c => c.id === activeCategory)!;
  const currentMetrics = metricsData[activeCategory];
  const currentFeed = feedItems[activeCategory];

  // SVG Helper components for Bento Cards
  const getBentoSvg = (categoryId: CategoryId, metricNum: 1 | 2) => {
    if (categoryId === "nutrition") {
      return metricNum === 1 ? (
        // Portion Icon (cup)
        <svg viewBox="0 0 24 24"><path d="M17 8h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/><path d="M5 8h12v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z"/></svg>
      ) : (
        // Texture Icon (spoon/fork)
        <svg viewBox="0 0 24 24"><path d="M18 8h-6a4 4 0 0 0-4 4v8"/><path d="M6 2v6a3 3 0 0 0 6 0V2"/></svg>
      );
    }
    if (categoryId === "sleep") {
      return metricNum === 1 ? (
        // Alarm clock
        <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="M19 3l3 3"/></svg>
      ) : (
        // Moon
        <svg viewBox="0 0 24 24"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      );
    }
    if (categoryId === "growth") {
      return metricNum === 1 ? (
        // Weight Scale
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 12V6"/><path d="M12 12l3 3"/></svg>
      ) : (
        // Ruler / Height
        <svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/><path d="M19 7h-4M19 11h-4M19 15h-4M19 19h-4M5 7h4M5 11h4M5 15h4M5 19h4"/></svg>
      );
    }
    if (categoryId === "vaccines") {
      return metricNum === 1 ? (
        // Syringe / Medicine
        <svg viewBox="0 0 24 24"><path d="m18 2 4 4M13 7l4 4M9 11l4 4M5 15l4 4M2 22l3-3M19 5l-8.5 8.5M5.5 18.5 7 17"/></svg>
      ) : (
        // Calendar
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      );
    }
    // Activity
    return metricNum === 1 ? (
      // Sensory blocks
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
    ) : (
      // Tree / Outdoor
      <svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/><path d="M12 10v12"/></svg>
    );
  };

  return (
    <main className="phone-frame">
      {/* 1. Header Section */}
      <header className="header">
        <div className="header-left">
          <span className="header-greeting-lbl">DAILY VITAL RECORD</span>
          <h1 className="header-title-name">Hi, Olivia 👋</h1>
        </div>
        <div className="header-right">
          <div className="profile-img-container">
            <Image
              src="/profile.png"
              alt="Parent Profile"
              fill
              className="profile-img"
              priority
            />
          </div>
          <div className="notification-badge" />
        </div>
      </header>

      {/* 2. Horizontal Scroll Category Selector */}
      <section 
        className="category-scroll-container" 
        ref={scrollContainerRef}
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <div 
              key={category.id} 
              className="category-btn-wrapper"
              id={`cat-btn-${category.id}`}
            >
              {isActive ? (
                <button 
                  className="category-btn-active"
                  onClick={() => setActiveCategory(category.id)}
                >
                  <div className="active-circle">{category.emoji}</div>
                  <span className="active-label">{category.label}</span>
                </button>
              ) : (
                <button 
                  className="category-btn-inactive"
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.emoji}
                </button>
              )}
            </div>
          );
        })}
      </section>

      {/* 3. Hero Feature Card (simulating view transitions with a custom key trigger) */}
      <section 
        key={activeCategory} 
        className="hero-card fade-transition"
      >
        <div className="decorative-blob" />
        
        <div className="hero-header">
          <div className="hero-icon-holder">
            <span>{currentCategoryConfig.emoji}</span>
          </div>
          <div className="hero-title-area">
            <span className="label-caps">LATEST HIGHLIGHT</span>
            <h2>{currentCategoryConfig.heroTitle}</h2>
          </div>
        </div>

        <p className="hero-card-desc">
          {currentCategoryConfig.heroDesc}
        </p>

        {/* 4. Bento Metric Cards */}
        <div className="bento-grid">
          {/* Card 1 */}
          <div className="bento-metric-card">
            <span className="bento-metric-label">{currentCategoryConfig.metric1Label}</span>
            <div className="bento-content">
              <div className="bento-icon-circle">
                {getBentoSvg(activeCategory, 1)}
              </div>
              <span className="bento-value">{currentMetrics.metric1}</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bento-metric-card">
            <span className="bento-metric-label">{currentCategoryConfig.metric2Label}</span>
            <div className="bento-content">
              <div className="bento-icon-circle">
                {getBentoSvg(activeCategory, 2)}
              </div>
              <span className="bento-value">{currentMetrics.metric2}</span>
            </div>
          </div>
        </div>

        {/* Info/Alert Bar */}
        <div className="hero-alert-box">
          <div className="hero-alert-text">
            {currentCategoryConfig.alertText}
          </div>
        </div>
      </section>

      {/* 5. Secondary Feed Items */}
      <section 
        key={`feed-${activeCategory}`} 
        className="feed-section fade-transition"
      >
        <div className="feed-header">
          <span className="label-caps">DAILY ACTIVITIES</span>
          <span className="label-caps" style={{ color: "var(--color-charcoal)", fontWeight: 800 }}>
            {currentFeed.filter(f => f.completed).length}/{currentFeed.length} DONE
          </span>
        </div>

        {currentFeed.map((item) => (
          <div 
            key={item.id} 
            className={`feed-card ${item.completed ? "completed" : ""}`}
          >
            <div className="feed-card-left">
              <div className="feed-icon-container">
                {item.emoji}
              </div>
              <div className="feed-text-area">
                <span className="feed-title">{item.title}</span>
                <span className="feed-subtitle">{item.subtitle}</span>
              </div>
            </div>

            {/* Trailing checkmark button */}
            <button 
              className={`checkbox-btn ${item.completed ? "checked" : ""}`}
              onClick={() => toggleFeedItem(activeCategory, item.id)}
              aria-label="Mark task completed"
            >
              <svg viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        ))}
      </section>

      {/* 6. Floating Bottom Navigation Bar */}
      <div className="nav-wrapper">
        <nav className="nav-pill-bar">
          {/* Dashboard/Home Icon */}
          <button 
            className={`nav-item-btn active`}
            aria-label="Dashboard Tab"
          >
            <svg viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          </button>

          {/* Floating center Red Action Button with cutout effect */}
          <div className="fab-container">
            <button 
              className={`fab-btn ${isModalOpen ? "open" : ""}`}
              onClick={handleOpenModal}
              aria-label="Add Log"
            >
              <svg viewBox="0 0 24 24" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          {/* Health/Stats Icon */}
          <button 
            className="nav-item-btn inactive"
            onClick={() => {
              // Interactive category change example as demo
              const list: CategoryId[] = ["nutrition", "sleep", "growth", "vaccines", "activity"];
              const currentIndex = list.indexOf(activeCategory);
              const nextIndex = (currentIndex + 1) % list.length;
              setActiveCategory(list[nextIndex]);
            }}
            aria-label="Quick Cycle Categories"
          >
            <svg viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </button>
        </nav>
      </div>

      {/* 7. Add Log Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="label-caps" style={{ color: "var(--color-vibrant-red)", fontSize: "12px" }}>LOG NEW RECORD</span>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: "none", border: "none", fontSize: "24px", color: "var(--color-sage)", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddLog} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="form-group">
                <label htmlFor="log-category">Category</label>
                <select 
                  id="log-category"
                  className="form-input form-select"
                  value={formCategory}
                  onChange={(e) => handleFormCategoryChange(e.target.value as CategoryId)}
                >
                  <option value="nutrition">🥑 Nutrition (Feeding, solids)</option>
                  <option value="sleep">🌙 Sleep (Naps, bedtimes)</option>
                  <option value="growth">📈 Growth (Weight, length)</option>
                  <option value="vaccines">🛡️ Health & Vaccines</option>
                  <option value="activity">🎨 Sensory Activities</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="log-title">Log Title / Action</label>
                <input 
                  id="log-title"
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Afternoon formula feeding, Nap 2, Weight update" 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label htmlFor="log-metric1">
                    {CATEGORIES.find(c => c.id === formCategory)?.metric1Label}
                  </label>
                  <input 
                    id="log-metric1"
                    type="text" 
                    className="form-input" 
                    value={formMetric1}
                    onChange={(e) => setFormMetric1(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="log-metric2">
                    {CATEGORIES.find(c => c.id === formCategory)?.metric2Label}
                  </label>
                  <input 
                    id="log-metric2"
                    type="text" 
                    className="form-input" 
                    value={formMetric2}
                    onChange={(e) => setFormMetric2(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="log-note">Additional Details / Notes</label>
                <input 
                  id="log-note"
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Drank all 180ml, fell asleep quickly, left leg administration" 
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                />
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
