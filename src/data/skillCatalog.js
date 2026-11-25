// Every skill the picker offers. `icon` is a key in ICON_BY_KEY (src/utils/skillIcons.js).
// `icon: null` shows a labelled badge (`abbr`) instead, for tools with no icon in the library.
// Categories match the tabs on the Skills page.

export const SKILL_CATEGORIES = [
  { id: 'languages', label: 'Languages' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'cloud', label: 'Cloud & Infra' },
  { id: 'tools', label: 'Tools' },
];

export const SKILL_CATALOG = [
  // Languages
  { name: 'C', category: 'languages', icon: 'siC', aliases: ['c programming', 'c language', 'c/c++'] },
  { name: 'C++', category: 'languages', icon: 'siCplusplus', aliases: ['cpp'] },
  { name: 'C#', category: 'languages', icon: null, abbr: 'C#', aliases: ['csharp'] },
  { name: 'Java', category: 'languages', icon: 'siOpenjdk' },
  { name: 'Python', category: 'languages', icon: 'siPython' },
  { name: 'JavaScript', category: 'languages', icon: 'siJavascript', aliases: ['js', 'es6'] },
  { name: 'TypeScript', category: 'languages', icon: 'siTypescript', aliases: ['ts'] },
  { name: 'Go', category: 'languages', icon: 'siGo', aliases: ['golang', 'go programming'] },
  { name: 'Rust', category: 'languages', icon: 'siRust' },
  { name: 'Kotlin', category: 'languages', icon: 'siKotlin' },
  { name: 'PHP', category: 'languages', icon: 'siPhp' },
  { name: 'Swift', category: 'languages', icon: 'siSwift' },
  { name: 'Ruby', category: 'languages', icon: 'siRuby' },
  { name: 'Dart', category: 'languages', icon: 'siDart' },
  { name: 'SQL', category: 'languages', icon: null, abbr: 'SQL' },
  { name: 'Bash', category: 'languages', icon: 'siGnubash', aliases: ['bash scripting'] },

  // Frontend
  { name: 'HTML', category: 'frontend', icon: 'siHtml5', aliases: ['html5'] },
  { name: 'CSS', category: 'frontend', icon: 'siCss', aliases: ['css3'] },
  { name: 'React', category: 'frontend', icon: 'siReact', aliases: ['reactjs'] },
  { name: 'Next.js', category: 'frontend', icon: 'siNextdotjs', aliases: ['nextjs'] },
  { name: 'Vue.js', category: 'frontend', icon: 'siVuedotjs', aliases: ['vue', 'vuejs'] },
  { name: 'Angular', category: 'frontend', icon: 'siAngular' },
  { name: 'Svelte', category: 'frontend', icon: 'siSvelte' },
  { name: 'Tailwind CSS', category: 'frontend', icon: 'siTailwindcss', aliases: ['tailwind', 'tailwindcss'] },
  { name: 'Bootstrap', category: 'frontend', icon: 'siBootstrap' },
  { name: 'Redux', category: 'frontend', icon: 'siRedux' },
  { name: 'Figma', category: 'frontend', icon: 'siFigma' },

  // Backend
  { name: 'Node.js', category: 'backend', icon: 'siNodedotjs', aliases: ['node', 'nodejs'] },
  { name: 'Express', category: 'backend', icon: 'siExpress', aliases: ['expressjs'] },
  { name: 'FastAPI', category: 'backend', icon: 'siFastapi' },
  { name: 'Django', category: 'backend', icon: 'siDjango' },
  { name: 'Flask', category: 'backend', icon: 'siFlask' },
  { name: 'Spring Boot', category: 'backend', icon: 'siSpringboot', aliases: ['spring framework'] },
  { name: 'GraphQL', category: 'backend', icon: 'siGraphql' },
  { name: 'REST APIs', category: 'backend', icon: null, abbr: 'API', aliases: ['rest api', 'restful api'] },
  { name: 'PostgreSQL', category: 'backend', icon: 'siPostgresql', aliases: ['postgres'] },
  { name: 'MySQL', category: 'backend', icon: 'siMysql' },
  { name: 'MongoDB', category: 'backend', icon: 'siMongodb', aliases: ['mongo'] },
  { name: 'Redis', category: 'backend', icon: 'siRedis' },
  { name: 'Firebase', category: 'backend', icon: 'siFirebase' },
  { name: 'Socket.IO', category: 'backend', icon: 'siSocketdotio', aliases: ['websockets', 'websocket'] },
  { name: 'Kafka', category: 'backend', icon: 'siApachekafka', aliases: ['apache kafka'] },
  { name: 'Prisma', category: 'backend', icon: 'siPrisma' },

  // Cloud & Infra
  { name: 'AWS', category: 'cloud', icon: null, abbr: 'AWS', aliases: ['amazon web services'] },
  { name: 'Azure', category: 'cloud', icon: null, abbr: 'Az', aliases: ['microsoft azure'] },
  { name: 'Google Cloud', category: 'cloud', icon: 'siGooglecloud', aliases: ['gcp'] },
  { name: 'Vercel', category: 'cloud', icon: 'siVercel' },
  { name: 'Netlify', category: 'cloud', icon: 'siNetlify' },
  { name: 'Cloudflare', category: 'cloud', icon: 'siCloudflare' },
  { name: 'Docker', category: 'cloud', icon: 'siDocker' },
  { name: 'Kubernetes', category: 'cloud', icon: 'siKubernetes', aliases: ['k8s'] },
  { name: 'Terraform', category: 'cloud', icon: 'siTerraform' },
  { name: 'Linux', category: 'cloud', icon: 'siLinux' },
  { name: 'Jenkins', category: 'cloud', icon: 'siJenkins' },
  { name: 'GitHub Actions', category: 'cloud', icon: 'siGithubactions' },
  { name: 'Supabase', category: 'cloud', icon: 'siSupabase' },

  // Tools
  { name: 'Git', category: 'tools', icon: 'siGit' },
  { name: 'GitHub', category: 'tools', icon: 'siGithub' },
  { name: 'npm', category: 'tools', icon: 'siNpm' },
  { name: 'Postman', category: 'tools', icon: 'siPostman' },
  { name: 'Jira', category: 'tools', icon: 'siJira' },
  { name: 'Jest', category: 'tools', icon: 'siJest' },
  { name: 'Pytest', category: 'tools', icon: 'siPytest' },
  { name: 'Vite', category: 'tools', icon: 'siVite' },
  { name: 'Chart.js', category: 'tools', icon: 'siChartdotjs', aliases: ['chartjs'] },
  { name: 'Pandas', category: 'tools', icon: 'siPandas' },
  { name: 'NumPy', category: 'tools', icon: 'siNumpy', aliases: ['numpy'] },
  { name: 'TensorFlow', category: 'tools', icon: 'siTensorflow' },
  { name: 'PyTorch', category: 'tools', icon: 'siPytorch' },
  { name: '.NET', category: 'tools', icon: 'siDotnet', aliases: ['dotnet', 'asp.net'] },
];
