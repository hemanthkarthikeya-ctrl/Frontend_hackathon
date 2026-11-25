// Skills Proof: computes evidence for each skill across projects, experience, certs, and optional GitHub repos.

const escRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function computeSkillsProof(data, githubRepos = []) {
  const skills = data.skills || [];
  const projects = data.projects || [];
  const experience = data.experience || [];
  const certs = data.certifications || [];

  return skills.map((skill) => {
    const rx = new RegExp(`(?<![a-z0-9+#.])${escRx(skill)}(?![a-z0-9+#])`, 'i');

    const matchedProjects = projects
      .filter((p) => rx.test([p.title, p.role, p.techStack, p.description].join(' ')))
      .map((p) => p.title);

    const matchedExp = experience
      .filter((e) => rx.test([e.role, e.company, e.description].join(' ')))
      .map((e) => `${e.role} @ ${e.company}`);

    const matchedCerts = certs
      .filter((c) => rx.test([c.name, c.issuer].join(' ')))
      .map((c) => c.name);

    const matchedRepos = githubRepos.filter(
      (r) => rx.test([r.language, ...(r.topics || []), r.name, r.description].join(' ')),
    );
    const stars = matchedRepos.reduce((sum, r) => sum + (r.stars || 0), 0);

    const totalEvidence = matchedProjects.length + matchedExp.length + matchedCerts.length + matchedRepos.length;

    return {
      skill,
      projects: matchedProjects,
      experience: matchedExp,
      certs: matchedCerts,
      repoCount: matchedRepos.length,
      stars,
      verified: totalEvidence > 0,
    };
  });
}
