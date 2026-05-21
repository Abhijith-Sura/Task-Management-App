export const boardTemplates = [
  {
    id: "software-kanban",
    title: "Software Kanban",
    description: "Ideal for product development, sprint iterations, and engineering teams chasing continuous delivery.",
    category: "Engineering",
    icon: "💻",
    lists: [
      {
        title: "Product Backlog",
        cards: [
          {
            title: "🔐 Integrate OAuth2.0 Authentication Suite",
            description: "Implement secure user registration, token validation, and password resets using JSON Web Tokens (JWT) and Bcrypt hashing.",
            priority: "high",
            labels: [{ text: "Security", color: "#EF4444" }, { text: "Backend", color: "#3B82F6" }],
            checklists: [
              {
                title: "OAuth Requirements",
                items: [
                  { text: "Configure JWT sign options & token lifetimes", completed: false },
                  { text: "Implement Bcrypt salt middleware in User Schema", completed: false },
                  { text: "Create gated authMiddleware verifying headers", completed: false }
                ]
              }
            ]
          },
          {
            title: "🚀 Build Automated CI/CD Deploy Pipelines",
            description: "Set up GitHub Actions to trigger automated test suites and push verified code directly to staging environments.",
            priority: "medium",
            labels: [{ text: "DevOps", color: "#10B981" }],
            checklists: [
              {
                title: "DevOps Deliverables",
                items: [
                  { text: "Draft .github/workflows/deploy.yml pipeline config", completed: false },
                  { text: "Inject environment tokens inside GitHub Secrets", completed: false }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "In Development",
        cards: [
          {
            title: "🔍 Program Faceted Search & Indexing Core",
            description: "Build high-performance aggregate search endpoints leveraging MongoDB $facet pipeline selectors to support granular multi-axis filters.",
            priority: "high",
            labels: [{ text: "Database", color: "#8B5CF6" }, { text: "Backend", color: "#3B82F6" }]
          }
        ]
      },
      {
        title: "Code Review / QA",
        cards: [
          {
            title: "🧪 Write End-to-End Cypress Integration Tests",
            description: "Verify login flows, task drag-and-drop actions, and board settings updates across all browser viewports.",
            priority: "medium",
            labels: [{ text: "QA", color: "#EC4899" }]
          }
        ]
      },
      {
        title: "Production Release",
        cards: [
          {
            title: "🎉 Launch Enterprise Multi-Tenant Spaces",
            description: "Successfully released granular Role-Based Access Control and automated workflow triggers.",
            priority: "low",
            labels: [{ text: "Release", color: "#F59E0B" }]
          }
        ]
      }
    ],
    automations: [
      {
        name: "Auto-Escalate Urgent Items",
        triggerType: "CARD_MOVED",
        triggerMetadata: { listName: "Product Backlog" },
        actionType: "SET_PRIORITY",
        actionMetadata: { priority: "high" }
      }
    ]
  },
  {
    id: "product-launch",
    title: "Product Launch Roadmap",
    description: "Launch your new product flawlessly! Map out design briefs, marketing campaign phases, and release preparation milestones.",
    category: "Marketing",
    icon: "🚀",
    lists: [
      {
        title: "Research & Design Briefs",
        cards: [
          {
            title: "📊 Execute Competitor Pricing Index Matrix",
            description: "Conduct market research on comparable SaaS pricing structures to design optimized multi-tier memberships.",
            priority: "medium",
            labels: [{ text: "Research", color: "#3B82F6" }]
          }
        ]
      },
      {
        title: "Content Prep & Marketing",
        cards: [
          {
            title: "🎨 Produce High-Fidelity SVG Landing Vector graphics",
            description: "Design sleek, glassmorphic layout mockups for our SaaS portal using responsive CSS tokens.",
            priority: "high",
            labels: [{ text: "Design", color: "#EC4899" }]
          }
        ]
      },
      {
        title: "Launch Prep & Warmup",
        cards: [
          {
            title: "📧 Draft Product Hunt transactional email briefs",
            description: "Design automated welcome emails and newsletter triggers targeted to early access customers.",
            priority: "medium",
            labels: [{ text: "Copywriting", color: "#10B981" }]
          }
        ]
      },
      {
        title: "Live Monitoring",
        cards: []
      }
    ]
  },
  {
    id: "scrum-sprint",
    title: "Agile Scrum Sprint Tracker",
    description: "Keep sprints organized. Perfect for managing Scrum poker backlog planning, sprint priorities, and retro analysis summaries.",
    category: "Management",
    icon: "🔄",
    lists: [
      {
        title: "Sprint Planning Backlog",
        cards: [
          {
            title: "👥 Hold Scrum Poker Estimation Sync",
            description: "Review backlog items with team members and assign story points to cards to prevent sprint bottlenecks.",
            priority: "medium",
            labels: [{ text: "Agile", color: "#8B5CF6" }]
          }
        ]
      },
      {
        title: "Active Sprint Tasks",
        cards: [
          {
            title: "🔐 Resolve auth session cookie expiration crash",
            description: "Fix a bug where session tokens expire prematurely, causing the client to render blank boards during loads.",
            priority: "high",
            labels: [{ text: "Bugfix", color: "#EF4444" }]
          }
        ]
      },
      {
        title: "Testing & Code Review",
        cards: []
      },
      {
        title: "Retrospective Analysis",
        cards: [
          {
            title: "📝 Draft Sprint Retrospective Summary logs",
            description: "Evaluate sprint velocity, analyze blocked dependencies, and list key actionable improvements for the next iteration.",
            priority: "low",
            labels: [{ text: "Retrospective", color: "#6B7280" }]
          }
        ]
      }
    ]
  }
];
export default boardTemplates;
