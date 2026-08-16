export const defaultDeveloperProfile = {
  title: 'Junior full-stack developer',
  summary: '',
  photo: '',
  isDisplayed: false,
  skills: ['React', 'Spring Boot', 'PostgreSQL'],
  contactLinks: {
    linkedinUrl: '',
    githubUrl: '',
    email: '',
    websiteUrl: '',
  },
  preferences: {
    availability: 'Open to junior roles',
    workTypes: ['Frontend', 'Full-stack'],
    remotePreference: 'Remote or hybrid',
  },
  connectionLabels: {},
  projects: [],
  posts: [],
};

export const defaultEmployerProfile = {
  title: 'Hiring team',
  summary: '',
  photo: '',
  isDisplayed: false,
  focus: ['React', 'APIs', 'Junior developer'],
  projects: [],
  posts: [],
  candidateStages: {},
};

const lipEmployerProfile = {
  title: 'Product founder hiring junior and early-career developers',
  summary:
    'I am building a small product team focused on practical web applications, internal dashboards, and customer-facing tools. I am looking for developers who can show real project evidence, communicate their decisions clearly, and contribute to reliable React and API-driven features. Strong candidates should be comfortable learning quickly, asking good questions, and turning rough product ideas into polished user experiences.',
  photo: '',
  isDisplayed: false,
  focus: ['React', 'REST APIs', 'Dashboards', 'Authentication flows', 'Junior developer', 'Project evidence'],
  projects: [],
  posts: [
    {
      id: 'lip-feed-react-dashboard',
      body: 'Looking for a junior React developer who can help build clean dashboard screens, connect to REST APIs, and explain their component decisions clearly.',
      createdAt: '2026-05-26T09:20:00.000Z',
    },
    {
      id: 'lip-feed-project-proof',
      body: 'Especially interested in developers with project proof: GitHub links, screenshots, and short write-ups about what they personally built.',
      createdAt: '2026-05-25T15:45:00.000Z',
    },
    {
      id: 'lip-feed-api-focus',
      body: 'Current priority is finding someone comfortable with forms, authentication flows, API error states, and turning rough product ideas into usable interfaces.',
      createdAt: '2026-05-24T11:10:00.000Z',
    },
    {
      id: 'lip-feed-growth-mindset',
      body: 'A strong fit would be someone early in their career who can talk through tradeoffs, respond well to feedback, and keep improving a feature after the first version works.',
      createdAt: '2026-05-23T13:30:00.000Z',
    },
  ],
};

const legacyJeiSummary =
  'Jei is building a small hiring and workflow platform for teams that want clearer developer proof, cleaner employer briefs, and faster shortlisting. We need junior developers who can learn quickly, communicate progress clearly, and help turn early product ideas into reliable React screens, API-backed workflows, and practical employer tools.';

const genericEmployerSummaries = ['', 'Employer profile.'];

const richJeiSummary =
  'Jei is building a proof-first hiring workspace for early-career developers and small hiring teams. The product focuses on replacing vague job-board signals with visible project evidence: employer briefs, developer portfolios, proof inboxes, saved candidates, and match explanations that show why someone may be able to solve a real product problem. We are looking for junior full-stack developers who can move thoughtfully across React screens, Spring Boot APIs, profile workflows, and dashboard UX. A strong fit is someone who can ask good questions, ship small reliable improvements, explain their decisions clearly, and turn rough hiring ideas into practical tools that feel calm, useful, and trustworthy.';

const jeiEmployerProfile = {
  title: 'Founder hiring junior full-stack product support',
  summary: richJeiSummary,
  photo: '',
  isDisplayed: false,
  focus: ['React', 'Spring Boot', 'REST APIs', 'Hiring workflows', 'Dashboard UI', 'Fast learner'],
  projects: [
    {
      id: 'jei-need-intake-workflow',
      name: 'Employer Intake Workflow',
      description:
        'Jei needs a junior developer to help build a guided employer intake flow where hiring teams describe the role, required stack, business problem, and what kind of project proof they want to see from candidates.',
      githubUrl: '',
      liveUrl: '',
      skills: ['React', 'Forms', 'REST APIs', 'Validation', 'UX Writing'],
      images: [],
      featured: true,
    },
    {
      id: 'jei-need-match-insights',
      name: 'Developer Match Insights Panel',
      description:
        'The platform needs a dashboard panel that explains why a developer matches an employer need, including matched skills, project evidence, gaps, and suggested follow-up questions for interviews.',
      githubUrl: '',
      liveUrl: '',
      skills: ['React', 'Dashboards', 'APIs', 'Data Display', 'Product Thinking'],
      images: [],
      featured: false,
    },
    {
      id: 'jei-need-profile-quality',
      name: 'Profile Quality Review Queue',
      description:
        'Jei needs an internal review queue for checking developer profiles, spotting missing GitHub links or weak project descriptions, and helping admins keep public profiles useful for employers.',
      githubUrl: '',
      liveUrl: '',
      skills: ['Spring Boot', 'PostgreSQL', 'Admin UI', 'CRUD', 'Quality Checks'],
      images: [],
      featured: false,
    },
  ],
  posts: [
    {
      id: 'jei-feed-full-stack',
      body: 'Looking for a junior full-stack developer who can help polish React dashboard flows and connect them cleanly to Spring Boot profile APIs.',
      createdAt: '2026-05-26T10:40:00.000Z',
    },
    {
      id: 'jei-feed-fast-learner',
      body: 'The ideal junior dev for Jei is someone who learns quickly, asks clear questions, and can turn a rough hiring workflow into a usable first version.',
      createdAt: '2026-05-25T13:15:00.000Z',
    },
    {
      id: 'jei-feed-proof-focus',
      body: 'Especially interested in candidates who understand project proof: screenshots, GitHub links, short technical explanations, and honest notes about what they personally built.',
      createdAt: '2026-05-24T09:30:00.000Z',
    },
  ],
};

const googleEmployerProfile = {
  title: 'Google Cloud team hiring junior product engineers',
  summary:
    'Google Cloud teams build tools that help developers and businesses understand, secure, and operate cloud systems at scale. This profile is looking for junior developers who can learn complex products quickly, communicate clearly, and contribute to practical dashboard, API, documentation, and developer-experience work with careful attention to reliability and user trust.',
  photo: '',
  isDisplayed: false,
  focus: ['React', 'Java', 'APIs', 'Cloud tools', 'Dashboards', 'Documentation'],
  projects: [
    {
      id: 'google-need-cloud-cost-insights',
      name: 'Cloud Cost Insights Dashboard',
      description:
        'The team needs help building a dashboard that helps small engineering teams understand cloud spend by service, project, and time period. A junior developer would focus on clear charts, filter controls, loading states, and readable explanations for non-expert users.',
      githubUrl: '',
      liveUrl: '',
      skills: ['React', 'Dashboards', 'Data Visualization', 'APIs', 'UX Writing'],
      images: [],
      featured: true,
    },
    {
      id: 'google-need-api-docs-sandbox',
      name: 'API Documentation Sandbox',
      description:
        'A developer-experience workflow needs an interactive API documentation sandbox where users can test sample requests, inspect responses, and understand common authentication or permission errors before integrating.',
      githubUrl: '',
      liveUrl: '',
      skills: ['JavaScript', 'REST APIs', 'Documentation', 'Authentication', 'Error States'],
      images: [],
      featured: false,
    },
    {
      id: 'google-need-support-triage-tool',
      name: 'Support Triage Tool',
      description:
        'The support team needs an internal tool that groups incoming technical issues by product area, severity, and missing information, helping engineers identify repeated problems and improve docs or product flows.',
      githubUrl: '',
      liveUrl: '',
      skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Admin UI', 'Workflow Tools'],
      images: [],
      featured: false,
    },
  ],
  posts: [
    {
      id: 'google-feed-cost-dashboard',
      body: 'Looking for junior developers interested in cloud product UX: dashboards, API-backed data, and clear explanations that help teams make better technical decisions.',
      createdAt: '2026-05-26T11:05:00.000Z',
    },
    {
      id: 'google-feed-devex',
      body: 'A strong candidate would show project proof around API integrations, error states, documentation, or developer tools. Clear README notes are a real plus.',
      createdAt: '2026-05-25T15:10:00.000Z',
    },
    {
      id: 'google-feed-learning',
      body: 'We value junior developers who can learn unfamiliar systems, ask precise questions, and make complex technical workflows easier for other people to use.',
      createdAt: '2026-05-24T12:35:00.000Z',
    },
  ],
};

export const emptyProject = {
  name: '',
  description: '',
  githubUrl: '',
  liveUrl: '',
  skills: '',
  images: [],
  featured: false,
};

const TECH_PROJECT_IMAGES = [
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
];

function projectImageCategory(project) {
  const text = `${project?.name ?? ''} ${(project?.description ?? '')} ${(project?.skills ?? []).join(' ')}`.toLowerCase();
  if (text.includes('dashboard') || text.includes('chart') || text.includes('report') || text.includes('analytics') || text.includes('csv') || text.includes('data')) {
    return 'dashboard';
  }
  if (text.includes('spring') || text.includes('api') || text.includes('auth') || text.includes('jwt') || text.includes('backend') || text.includes('documentation')) {
    return 'backend';
  }
  if (text.includes('docker') || text.includes('deploy') || text.includes('cloud') || text.includes('server') || text.includes('environment')) {
    return 'cloud';
  }
  if (text.includes('workflow') || text.includes('admin') || text.includes('support') || text.includes('queue') || text.includes('rails') || text.includes('crud')) {
    return 'workflow';
  }
  return 'general';
}

function slugifyProjectSeed(value) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function fallbackProjectImages(project) {
  const category = projectImageCategory(project);
  const categoryOffset = {
    dashboard: 0,
    backend: 4,
    cloud: 8,
    workflow: 12,
    general: 14,
  }[category] ?? 0;
  const projectSeed = `${slugifyProjectSeed(project?.id ?? '')}-${slugifyProjectSeed(project?.name ?? '')}`;
  const baseIndex = Math.abs(Array.from(projectSeed).reduce((total, char) => total + char.charCodeAt(0), 0) + categoryOffset) % TECH_PROJECT_IMAGES.length;
  return Array.from({ length: 3 }, (_, index) => TECH_PROJECT_IMAGES[(baseIndex + index) % TECH_PROJECT_IMAGES.length]);
}

function normalizeProjectImages(project) {
  const validImages = (project.images ?? [])
    .filter(Boolean)
    .filter((image) => !image.includes('source.unsplash.com'));
  return validImages.length > 0 ? validImages : fallbackProjectImages(project);
}

export function normalizeProjects(projects = []) {
  return projects
    .map((project) => ({
      ...project,
      id: project.id ?? crypto.randomUUID(),
      skills: project.skills ?? [],
      images: normalizeProjectImages(project),
      featured: Boolean(project.featured),
    }))
    .sort((first, second) => Number(Boolean(second.featured)) - Number(Boolean(first.featured)));
}

export function readStoredDeveloperProfile(storageKey) {
  const storedProfile = localStorage.getItem(storageKey);
  if (!storedProfile) {
    return defaultDeveloperProfile;
  }
  try {
    const parsedProfile = JSON.parse(storedProfile);
    return {
      ...defaultDeveloperProfile,
      ...parsedProfile,
      isDisplayed: parsedProfile.isDisplayed ?? parsedProfile.isPublished ?? false,
      contactLinks: {
        ...defaultDeveloperProfile.contactLinks,
        ...(parsedProfile.contactLinks ?? {}),
      },
      preferences: {
        ...defaultDeveloperProfile.preferences,
        ...(parsedProfile.preferences ?? {}),
        workTypes: parsedProfile.preferences?.workTypes ?? defaultDeveloperProfile.preferences.workTypes,
      },
      connectionLabels: parsedProfile.connectionLabels ?? {},
      projects: normalizeProjects(parsedProfile.projects ?? []),
      posts: parsedProfile.posts ?? [],
    };
  } catch {
    return defaultDeveloperProfile;
  }
}

export function readStoredEmployerProfile(storageKey, user) {
  const storedProfile = localStorage.getItem(storageKey);
  const seededProfile = seededEmployerProfileFor(user);
  if (!storedProfile) {
    return seededProfile;
  }
  try {
    const parsedProfile = JSON.parse(storedProfile);
    const hasCustomTitle = parsedProfile.title && parsedProfile.title !== defaultEmployerProfile.title;
    const hasCustomFocus = (parsedProfile.focus ?? []).some((item) => !defaultEmployerProfile.focus.includes(item));
    const shouldUseSeededSummary = parsedProfile.summary === legacyJeiSummary || genericEmployerSummaries.includes(parsedProfile.summary ?? '');
    return {
      ...defaultEmployerProfile,
      ...seededProfile,
      ...parsedProfile,
      title: hasCustomTitle ? parsedProfile.title : seededProfile.title,
      summary: shouldUseSeededSummary ? seededProfile.summary : parsedProfile.summary || seededProfile.summary,
      isDisplayed: parsedProfile.isDisplayed ?? parsedProfile.isPublished ?? parsedProfile.displayed ?? false,
      focus: hasCustomFocus ? parsedProfile.focus : seededProfile.focus,
      projects: normalizeProjects((parsedProfile.projects ?? []).length > 0 ? parsedProfile.projects : seededProfile.projects),
      posts: (parsedProfile.posts ?? []).length > 0 ? parsedProfile.posts : seededProfile.posts,
      candidateStages: parsedProfile.candidateStages ?? seededProfile.candidateStages ?? {},
      name: user.name,
    };
  } catch {
    return seededProfile;
  }
}

function seededEmployerProfileFor(user) {
  const searchableUser = `${user?.name ?? ''} ${user?.email ?? ''}`.toLowerCase();
  if (searchableUser.includes('jei')) {
    return jeiEmployerProfile;
  }
  if (searchableUser.includes('google')) {
    return googleEmployerProfile;
  }
  if (searchableUser.includes('lip')) {
    return lipEmployerProfile;
  }
  return defaultEmployerProfile;
}

export function formatPostDate(dateValue) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateValue));
}

export function readImage(file, onLoad) {
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onLoad(reader.result);
  reader.readAsDataURL(file);
}

export function toProfilePayload(profile, displayed = profile.isDisplayed) {
  return {
    title: profile.title,
    summary: profile.summary,
    image: profile.photo,
    skills: profile.skills,
    contactLinks: profile.contactLinks ?? defaultDeveloperProfile.contactLinks,
    preferences: profile.preferences ?? defaultDeveloperProfile.preferences,
    projects: profile.projects.map((project) => ({
      name: project.name,
      description: project.description,
      githubUrl: project.githubUrl,
      liveUrl: project.liveUrl,
      skills: project.skills ?? [],
      images: project.images ?? [],
      featured: Boolean(project.featured),
    })),
    posts: (profile.posts ?? []).map((post) => ({
      id: post.id,
      body: post.body,
      createdAt: post.createdAt,
    })),
    displayed,
  };
}

export function toEmployerProfilePayload(profile, displayed = profile.isDisplayed) {
  return {
    title: profile.title,
    summary: profile.summary,
    image: profile.photo,
    skills: profile.focus,
    projects: normalizeProjects(profile.projects ?? []).map((project) => ({
      name: project.name,
      description: project.description,
      githubUrl: project.githubUrl ?? '',
      liveUrl: project.liveUrl ?? '',
      skills: project.skills ?? [],
      images: project.images ?? [],
      featured: Boolean(project.featured),
    })),
    posts: (profile.posts ?? []).map((post) => ({
      id: post.id,
      body: post.body,
      createdAt: post.createdAt,
    })),
    displayed,
  };
}
