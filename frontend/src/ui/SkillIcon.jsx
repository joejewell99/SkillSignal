import React from 'react';
import { icons as officialLogos } from '@iconify-json/logos';
import { AlertTriangle, BarChart3, Database, FormInput, LayoutDashboard, PlugZap, ServerCog, ShieldCheck } from 'lucide-react';
import { siAngular, siApachecassandra, siApachecouchdb, siApachekafka, siBootstrap, siCplusplus, siCypress, siDocker, siDotnet, siDjango, siElasticsearch, siExpress, siFastapi, siFigma, siFirebase, siFlask, siGit, siGithub, siGo, siGooglecloud, siGraphql, siInfluxdb, siJenkins, siJest, siJavascript, siKotlin, siKubernetes, siLaravel, siLinux, siMongodb, siMysql, siMariadb, siNeo4j, siNestjs, siNginx, siNodedotjs, siOpenjdk, siPhp, siPostgresql, siPostman, siPrisma, siPython, siRabbitmq, siReact, siRedis, siRuby, siRubyonrails, siRust, siSass, siSqlite, siSpring, siStorybook, siSupabase, siSwift, siTerraform, siTypescript, siUbuntu, siVite, siVuedotjs, siWebpack } from 'simple-icons';

const iconMap = [
  [['postgres', 'postgresql'], siPostgresql], [['mysql'], siMysql], [['mongo', 'mongodb'], siMongodb], [['redis'], siRedis],
  [['sqlite'], siSqlite], [['mariadb'], siMariadb], [['cassandra'], siApachecassandra], [['couchdb'], siApachecouchdb], [['neo4j'], siNeo4j], [['influxdb'], siInfluxdb],
  [['docker'], siDocker], [['kubernetes'], siKubernetes], [['kafka'], siApachekafka], [['rabbitmq'], siRabbitmq], [['elasticsearch'], siElasticsearch],
  [['git'], siGit], [['github'], siGithub], [['jenkins'], siJenkins], [['terraform'], siTerraform], [['nginx'], siNginx],
  [['react'], siReact], [['angular'], siAngular], [['vue'], siVuedotjs], [['node'], siNodedotjs], [['typescript'], siTypescript],
  [['javascript', 'js'], siJavascript], [['python'], siPython], [['ruby'], siRuby], [['java', 'openjdk'], siOpenjdk], [['kotlin'], siKotlin], [['swift'], siSwift], [['c++'], siCplusplus], [['c#', 'dotnet', '.net'], siDotnet], [['go'], siGo], [['rust'], siRust],
  [['spring'], siSpring], [['django'], siDjango], [['fastapi'], siFastapi], [['flask'], siFlask], [['express'], siExpress], [['nestjs'], siNestjs], [['laravel'], siLaravel], [['rails'], siRubyonrails],
  [['graphql'], siGraphql], [['php'], siPhp], [['vite'], siVite], [['webpack'], siWebpack], [['sass'], siSass], [['bootstrap'], siBootstrap],
  [['firebase'], siFirebase], [['supabase'], siSupabase], [['prisma'], siPrisma], [['postman'], siPostman], [['figma'], siFigma], [['storybook'], siStorybook], [['cypress'], siCypress], [['jest'], siJest], [['ubuntu'], siUbuntu], [['linux'], siLinux], [['google cloud', 'gcp'], siGooglecloud],
];

const conceptMap = [
  [['sql', 'database', 'databases', 'data store'], Database],
  [['dashboard', 'admin panel', 'analytics', 'reporting'], LayoutDashboard],
  [['rest api', 'restful', 'api', 'authentication', 'auth', 'security', 'oauth', 'jwt'], ShieldCheck],
  [['form', 'forms', 'validation'], FormInput],
  [['backend', 'server', 'microservice'], ServerCog],
  [['integration', 'automation', 'workflow'], PlugZap],
  [['data', 'chart', 'metrics'], BarChart3],
];

const obviousOffTopic = new Set(['pen', 'pens', 'chocolate', 'kitchen', 'aardvark', 'banana', 'football', 'pizza']);

function distance(left, right) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = row[j];
      row[j] = left[i - 1] === right[j - 1]
        ? diagonal
        : Math.min(diagonal + 1, row[j] + 1, row[j - 1] + 1);
      diagonal = above;
    }
  }
  return row[right.length];
}

export function getSkillIcon(skill) {
  const value = String(skill).toLowerCase().trim();
  const brand = iconMap.find(([terms]) => terms.some((term) => value.includes(term)))?.[1];
  if (brand) return { type: 'brand', icon: brand };
  const fuzzyBrand = iconMap.find(([terms]) => terms.some((term) => term.length >= 5 && distance(value, term) <= (term.length > 7 ? 2 : 1)))?.[1];
  if (fuzzyBrand) return { type: 'brand', icon: fuzzyBrand };
  const concept = conceptMap.find(([terms]) => terms.some((term) => value.includes(term)))?.[1];
  return concept ? { type: 'concept', icon: concept } : null;
}

export function isRecognizedSkill(skill) {
  return Boolean(getSkillIcon(skill));
}

export function isObviouslyOffTopic(skill) {
  return obviousOffTopic.has(String(skill).toLowerCase().trim());
}

export function getSkillRecognition(skill) {
  if (isObviouslyOffTopic(skill)) return 'off-topic';
  return isRecognizedSkill(skill) ? 'recognized' : 'unknown';
}

export default function SkillIcon({ skill }) {
  const value = String(skill).toLowerCase();
  const match = getSkillIcon(value);
  if (isObviouslyOffTopic(value)) return <AlertTriangle className="skill-chip-icon skill-chip-warning-icon" size={14} strokeWidth={2.2} aria-label="Unrecognized skill" />;
  if (!match) return null;
  if (match.type === 'concept') {
    const Icon = match.icon;
    return <Icon className="skill-chip-icon skill-chip-concept-icon" size={14} strokeWidth={2.1} aria-hidden="true" />;
  }
  const isPython = match.icon.title === 'Python';
  const isJava = match.icon.title === 'OpenJDK';
  if (isJava && officialLogos.icons.java) {
    return <svg className="skill-chip-icon skill-chip-brand-icon skill-chip-java-icon" viewBox="0 0 256 346" role="img" aria-label="Java logo" preserveAspectRatio="xMidYMid meet" dangerouslySetInnerHTML={{ __html: officialLogos.icons.java.body }} />;
  }
  if (isPython && officialLogos.icons.python) {
    return <svg className="skill-chip-icon skill-chip-brand-icon" viewBox="0 0 256 256" role="img" aria-label="Python logo" preserveAspectRatio="xMidYMid meet" dangerouslySetInnerHTML={{ __html: officialLogos.icons.python.body }} />;
  }
  const brandColor = isJava ? '#ed8b00' : `#${match.icon.hex}`;
  return (
    <svg className="skill-chip-icon skill-chip-brand-icon" viewBox="0 0 24 24" role="img" aria-label={`${skill} logo`} style={{ color: brandColor }}>
      <path d={match.icon.path} fill="currentColor" />
    </svg>
  );
}
