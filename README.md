# Vulnerability Explorer

A modern, AI-powered vulnerability analysis tool that transforms security findings into an interactive knowledge graph. Built with Next.js, Neo4j, and advanced AI agents for intelligent security insights.

## 🌐 Live Demo

**Try it now:** [https://vuln-graph.vercel.app/](https://vuln-graph.vercel.app/)

## 🎯 What is Vulnerability Explorer?

Vulnerability Explorer is a sophisticated security analysis platform that:

- **Ingests vulnerability findings** from various security scanners (OWASP ZAP, BurpSuite, Semgrep, Trivy, etc.)
- **Creates a knowledge graph** using Neo4j to map relationships between vulnerabilities, assets, and exploit chains
- **Provides AI-powered analysis** through intelligent agents that can answer complex security questions
- **Visualizes data** through interactive graphs and tables for better understanding

## 🚀 Key Features

### 🔍 Intelligent Query System
- Ask natural language questions about your security posture
- Get detailed analysis of exploit chains and attack paths
- Understand vulnerability relationships and dependencies

### 📊 Interactive Visualizations
- **Graph View**: Explore vulnerability relationships in an interactive network graph
- **Table View**: Analyze findings in structured tabular format
- **Real-time switching** between visualization modes

### 🤖 AI-Powered Analysis
- Multi-agent reasoning system for comprehensive security insights
- Automatic exploit chain detection and severity assessment
- Detailed remediation recommendations with complexity analysis

### 🎨 Modern UI/UX
- Dark theme with premium styling inspired by modern security tools
- Smooth animations and crisp interactions
- Responsive design for all devices

## 🛠️ How It Works

### 1. Data Ingestion
The system ingests vulnerability findings from various sources:
- **OWASP ZAP**: Web application vulnerabilities
- **BurpSuite**: Network and API security issues
- **Semgrep**: Static code analysis findings
- **Trivy**: Container and dependency vulnerabilities
- **Custom scanners**: Any security tool output

### 2. Knowledge Graph Creation
Findings are processed and stored in Neo4j with rich relationships:
- **Vulnerabilities** → **Assets** (services, endpoints, files)
- **Exploit Chains** → **Attack Paths** (multi-step vulnerabilities)
- **Severity Mapping** → **Risk Assessment** (CVSS scores, impact analysis)
- **Remediation Links** → **Fix Recommendations** (complexity, effort)

### 3. AI Analysis Pipeline
When you ask a question, the system:
1. **Classifies intent** (list, aggregate, trace, map, etc.)
2. **Extracts entities** (services, severity, vulnerability types)
3. **Generates Cypher queries** for Neo4j
4. **Executes analysis** with multiple AI agents
5. **Returns insights** with reasoning and recommendations

## 💡 How to Use

### Getting Started
1. Visit [https://vuln-graph.vercel.app/](https://vuln-graph.vercel.app/)
2. The interface shows a split view: visualization panel (left) and chat panel (right)

### Asking Questions
Try these example queries:
- *"Show me all critical vulnerabilities"*
- *"What exploit chains exist in the order service?"*
- *"Which vulnerabilities affect the admin panel?"*
- *"Find all SQL injection vulnerabilities"*
- *"What's the attack path from broken access control?"*

### Exploring Results
- **Graph View**: Click and drag nodes to explore relationships
- **Table View**: Sort and analyze findings in tabular format
- **Toggle Views**: Switch between visualization modes
- **Zoom Controls**: Use + and - buttons to adjust graph scale

### Understanding Responses
Each AI response includes:
- **Direct Answer**: Clear, actionable insights
- **Reasoning**: Step-by-step analysis process
- **Cypher Query**: The database query used (expandable)
- **Severity Assessment**: Risk levels and impact analysis

## 🏗️ Technical Architecture

### Frontend
- **Next.js 15** with TypeScript
- **React Force Graph** for interactive visualizations
- **Tailwind CSS** for styling
- **LiteLLM** for AI integration

### Backend
- **Next.js API Routes** for server-side logic
- **Neo4j AuraDB** for graph database
- **Multi-agent AI pipeline** for intelligent analysis

### AI Components
- **Intent Classification**: Understands user questions
- **Entity Extraction**: Identifies relevant security concepts
- **Query Generation**: Creates optimized Neo4j queries
- **Response Synthesis**: Generates human-readable insights

## 🔧 Development

### Prerequisites
- Node.js 18+
- Neo4j AuraDB account
- LiteLLM API credentials

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd VulnGraph

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Neo4j and LiteLLM credentials

# Run development server
npm run dev
```

### Environment Variables
```env
NEO4J_URI=your-neo4j-uri
NEO4J_USERNAME=your-username
NEO4J_PASSWORD=your-password
LITELLM_API_KEY=your-litellm-key
LITELLM_BASE_URL=your-litellm-url
```

## 📈 Use Cases

### Security Teams
- **Vulnerability Assessment**: Quickly understand your security posture
- **Exploit Chain Analysis**: Identify attack paths and dependencies
- **Remediation Planning**: Prioritize fixes based on impact and complexity
- **Compliance Reporting**: Generate detailed security reports

### Penetration Testers
- **Attack Path Discovery**: Find the most effective exploitation routes
- **Vulnerability Correlation**: Understand how findings relate to each other
- **Proof of Concept**: Validate exploit chains and attack scenarios

### DevOps Engineers
- **Security Integration**: Understand vulnerabilities in your infrastructure
- **Risk Assessment**: Evaluate the impact of security issues
- **Deployment Decisions**: Make informed choices about security fixes

## 🤝 Contributing

This project is designed for security professionals and developers. Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Live Demo**: [https://vuln-graph.vercel.app/](https://vuln-graph.vercel.app/)
- **Neo4j**: [https://neo4j.com/](https://neo4j.com/)
- **Next.js**: [https://nextjs.org/](https://nextjs.org/)
- **LiteLLM**: [https://litellm.ai/](https://litellm.ai/)

---

**Built with ❤️ for the security community**
