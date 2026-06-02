import React from 'react';

export default function EmployerNeedsList({ needs = [], fallbackProjects = [], describeIdealDeveloper }) {
  const normalizedNeeds = needs.length > 0
    ? needs
    : fallbackProjects.map((project) => ({
        title: project.name,
        problem: project.description,
        requiredSkills: project.skills ?? [],
        evidenceWanted: '',
        featured: project.featured,
      }));

  if (normalizedNeeds.length === 0) {
    return <p className="subtle">This employer has not published detailed hiring needs yet.</p>;
  }

  return (
    <div className="hiring-need-list">
      {normalizedNeeds.map((need) => (
        <article className="hiring-need-card" key={need.title}>
          <div className="hiring-need-heading">
            <span className="profile-type employer">{need.featured ? 'Priority need' : 'Hiring need'}</span>
            <h3>{need.title}</h3>
            <p>{need.problem}</p>
          </div>
          <div className="hiring-need-meta">
            <div>
              <h4>Required skills</h4>
              <div className="skill-list">
                {(need.requiredSkills ?? []).map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
            <div>
              <h4>What to show</h4>
              <p>{need.evidenceWanted || describeIdealDeveloper(need)}</p>
            </div>
            <div>
              <h4>Good fit</h4>
              <p>{describeIdealDeveloper({ name: need.title, skills: need.requiredSkills })}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
