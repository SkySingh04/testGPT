# Keploy Github App

**Streamline your code reviews with flexible, AI-powered analysis**

Keploy Github App is an open-source, self-hosted AI tool designed to automate and enhance reviews of code, documentation, and more. It empowers teams to enforce standards, streamline workflows, and improve security without vendor lock-in or hidden costs. Choose any language model (LLM), including self-hosted ones via Ollama or open-source alternatives.

## 🌟 Key Features

### 1️⃣ **Customizable Review Rules**
- Define your team's standards in a `RULES.md`, YAML, or JSON file
- Enforce coding standards, documentation guidelines, and security best practices
- Automatically flag inconsistencies like mixed naming conventions or inadequate error handling

### 2️⃣ **Static Analysis + AI-Powered Review**
- Combines traditional static analysis with advanced AI reasoning
- Analyzes PRs based on your custom rule set
- Highlights style, security, and architectural concerns
- Provides actionable improvement suggestions

### 3️⃣ **Flexible LLM Integration**
- Choose the best model for your specific use case:
  - For code reviews: Models like OpenAI Codex or Mistral
  - For documentation: Models better suited for writing, such as GPT-4 or Claude
- Supports both open-source and commercial LLMs
- Configure via `keploy-config.json` file

### 4️⃣ **GitHub Integration**
- Automatically reviews pull requests when opened or updated
- Provides inline comments directly in your PRs
- Works with your existing GitHub workflow

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- GitHub account and repository (for GitHub integration)

### Installation

1. **Clone the repository and checkout the branch**
   ```bash
   git clone https://github.com/SkySingh04/testGPT.git
   git fetch
   git checkout github-app-pr
   cd keploy-github-app-beta
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the app**
   Run the CLI configuration tool to set up the app for your use case:
   ```bash
   npm run dev
   ```
   
   This will prompt you to select:
   - Your use case (code review, documentation review, etc.)
   - API endpoint for your LLM
   - Preferred language model

   Alternatively, you can manually create a `keploy-config.json` file in the project root:
   ```json
   {
     "useCase": "Code Review",
     "apiEndpoint": "YOUR_LLM_API_ENDPOINT",
     "selectedModel": "YOUR_PREFERRED_MODEL"
   }
   ```

4. **Setup GitHub App (for GitHub integration)**
   
   - Create a new GitHub App in your GitHub account
   - Set the following permissions:
     - Pull requests: Read & Write
     - Repository contents: Read
   - Subscribe to pull request events
   - Generate and download a private key
   - Install the app on your repositories
   - Configure environment variables (create a `.env` file):
     ```
     APP_ID=your_github_app_id
     PRIVATE_KEY=your_github_app_private_key
     WEBHOOK_SECRET=your_webhook_secret
     ```

5. **Start Keploy Github App**
   ```bash
   npm start
   ```

## 📋 Usage

### Define Review Rules
Create a `RULES.md` file in your repository with your team's standards:

```markdown
# Code Review Rules

## Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces

## Error Handling
- All errors must be properly caught and logged
- No empty catch blocks allowed

## Documentation
- All public functions must have JSDoc comments
- Include examples for complex functions
```

### Running Keploy Github App Locally
To review code locally before committing:

```bash
npm run start
```

### GitHub Integration
Once configured, Keploy Github App will automatically:
1. Monitor pull requests in repositories where the GitHub App is installed
2. Analyze the code changes against your defined rules
3. Provide feedback as comments directly in the PR

## 🔧 Advanced Configuration

### Custom LLM Configuration
For using specific LLMs, update your `keploy-config.json`:

```json
{
  "useCase": "Security Review",
  "apiEndpoint": "https://api.openai.com/v1/chat/completions",
  "selectedModel": "gpt-4"
}
```

## 👥 Contributing

We welcome contributions from the community! Please check our [CONTRIBUTING.md](./CONTRIBUTING.md) guide for:

1. **Development Setup**
   - Fork and clone the repository
   - Install dependencies: `npm install`
   - Start the development server: `npm run start`

2. **Coding Standards**
   - Use TypeScript for all new code
   - Follow the existing code style
   - Add comments for complex logic
   - Include tests for new features

3. **Pull Request Process**
   - Create a branch for your changes
   - Make your changes and commit them
   - Write clear commit messages
   - Update documentation if needed
   - Submit a PR with a description of your changes

Looking for something to work on? Check out our good first issues - these are perfect for getting started!

### DEMO VIDEO : 

https://github.com/user-attachments/assets/8ee879b8-3200-41bd-a015-674db3e13534
