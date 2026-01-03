# FlowBot - Intelligent Chatbot System

AI-powered chatbot system by DisHub with multi-step wizards, real-time communication, and advanced analytics capabilities.

## 🎯 What It Does

Transform your system into an intelligent chatbot that can:

- **Search & Analyze**: Query data across MeiliSearch and SQL databases
- **Manipulate Dashboards**: Apply filters, change views, create charts in real-time
- **Guide Users**: Multi-step wizards for complex tasks (reports, data exports, etc.)
- **Learn & Remember**: Conversation memory and personalized interactions
- **Stream Responses**: Real-time chat with typing indicators and live updates

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Services      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (Redis,       │
│                 │    │                 │    │    MeiliSearch, │
│ • React UI      │    │ • LangChain     │    │    PostgreSQL)  │
│ • WebSocket     │    │ • WebSockets    │    │                 │
│ • State Mgmt    │    │ • REST API      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   AI Agent      │
                       │   (Tools)       │
                       │                 │
                       │ • Search Tools  │
                       │ • Dashboard     │
                       │ • Wizard Tools  │
                       │ • Memory        │
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis
- MeiliSearch

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Edit with your API keys
python -m uvicorn app.main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend  # or root if using monorepo
npm install
npm run dev
```

### 3. Services Setup

```bash
# PostgreSQL (local or cloud)
# Redis (Railway config provided)
# MeiliSearch (local or cloud)
```

## 📋 Features

### 🤖 AI Agent Capabilities
- **Conversation Memory**: Remembers context across messages
- **Tool Integration**: Access to search, database, and dashboard functions
- **Streaming Responses**: Real-time chat with typing indicators
- **Multi-step Wizards**: Guided workflows for complex tasks

### 🔍 Search & Analytics
- **MeiliSearch Integration**: Fast text search with filters
- **SQL Database Queries**: Complex analytics with safe query execution
- **Real-time Results**: Live dashboard updates as you chat

### 📊 Dashboard Control
- **Dynamic Filters**: Apply and modify dashboard filters via chat
- **View Switching**: Change dashboard pages and visualizations
- **Chart Creation**: Generate new charts based on your requests
- **Data Export**: Export filtered data in multiple formats

### 🧙 Multi-Step Wizards
- **Report Creator**: Build custom analytics reports step-by-step
- **Data Filters**: Set up complex filtering workflows
- **Export Wizard**: Configure data exports with custom formatting

## 🔧 Configuration

### Environment Variables

```env
# LLM Configuration
OPENROUTER_API_KEY=your_key_here
DEFAULT_MODEL=anthropic/claude-3.5-sonnet

# Database & Services
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://default:password@host:6379
MEILISEARCH_URL=http://localhost:7700

# Application
SECRET_KEY=your_secure_key
DEBUG=true
```

## 🛠️ Development

### Project Structure
```
├── backend/
│   ├── app/
│   │   ├── api/routes/     # API endpoints
│   │   ├── core/          # LangChain agents & tools
│   │   ├── services/      # External service integrations
│   │   ├── wizards/       # Multi-step wizard definitions
│   │   └── config.py      # Configuration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   └── services/      # API/WebSocket clients
│   └── package.json
└── docker-compose.yml
```

### Adding New Tools

1. **Define the tool** in `backend/app/core/tools.py`:
```python
@tool
def your_new_tool(param: str) -> str:
    """Tool description for AI"""
    # Implementation
    return result
```

2. **Add to tool list**:
```python
ALL_TOOLS = [
    # ... existing tools
    your_new_tool,
]

TOOL_DESCRIPTIONS = {
    # ... existing descriptions
    "your_new_tool": "What this tool does",
}
```

### Creating New Wizards

1. **Create wizard class** in `backend/app/wizards/definitions/`:
```python
from app.wizards.base import BaseWizard

class YourWizard(BaseWizard):
    def get_wizard_type(self) -> str:
        return "your_wizard"

    def get_max_steps(self) -> int:
        return 3

    def get_step_prompt(self, step: int, data: Dict) -> str:
        prompts = {
            1: "First question?",
            2: "Second question?",
            3: "Third question?"
        }
        return prompts[step]

    def validate_step(self, step: int, user_input: str, current_data: Dict) -> Dict:
        # Validation logic
        return {"valid": True, "data": {"field": user_input}}

    def process_step(self, step: int, validated_data: Dict, all_data: Dict) -> Dict:
        # Processing logic
        return {"data": validated_data}
```

2. **Register the wizard** in `backend/app/api/routes/wizards.py`:
```python
from app.wizards.definitions.your_wizard import YourWizard

WIZARD_REGISTRY = {
    "report": ReportWizard,
    "your_wizard": YourWizard,
}
```

## 🚀 Deployment

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3
```

### Production Checklist

- [ ] Set `DEBUG=false`
- [ ] Configure production database URLs
- [ ] Set secure `SECRET_KEY`
- [ ] Enable LangSmith tracing for debugging
- [ ] Configure monitoring and alerting
- [ ] Set up SSL/TLS certificates
- [ ] Configure load balancer for WebSocket sticky sessions

## 🔍 Monitoring & Debugging

### LangSmith Integration
```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_key
LANGCHAIN_PROJECT=flowbot
```

### Health Checks
- `GET /health` - System health status
- Individual service health monitoring

### Logging
- Structured logging with request IDs
- Error tracking with context
- Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## 📄 License

[Your License Here]

## 🙋 Support

For questions or issues:
- Check the [documentation](./docs/)
- Open an issue on GitHub
- Contact the development team

---

**Built with:** FastAPI, LangChain, Next.js, PostgreSQL, Redis, MeiliSearch