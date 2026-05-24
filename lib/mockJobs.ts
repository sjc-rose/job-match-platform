export const educationLevels = ["高中", "大专", "本科", "硕士", "博士"] as const;

export type EducationLevel = (typeof educationLevels)[number];

export type Job = {
  id: string;
  title: string;
  company: string;
  city: string;
  salaryMin: number;
  salaryMax: number;
  educationRequirement: EducationLevel;
  experienceRequirement: number;
  description: string;
  applyUrl: string;
};

export const mockJobs: Job[] = [
  {
    id: "1",
    title: "前端开发工程师",
    company: "星河科技",
    city: "上海",
    salaryMin: 18000,
    salaryMax: 28000,
    educationRequirement: "本科",
    experienceRequirement: 2,
    description: "负责 Next.js 和 React 业务页面开发，参与招聘平台用户体验优化。",
    applyUrl: "https://example.com/jobs/frontend-shanghai",
  },
  {
    id: "2",
    title: "后端开发工程师",
    company: "云启数据",
    city: "北京",
    salaryMin: 22000,
    salaryMax: 35000,
    educationRequirement: "本科",
    experienceRequirement: 3,
    description: "负责 Node.js 服务端接口、数据建模和高并发系统稳定性建设。",
    applyUrl: "https://example.com/jobs/backend-beijing",
  },
  {
    id: "3",
    title: "数据分析师",
    company: "数智未来",
    city: "杭州",
    salaryMin: 15000,
    salaryMax: 24000,
    educationRequirement: "本科",
    experienceRequirement: 1,
    description: "使用 SQL、Python 和 BI 工具分析业务数据，输出招聘转化洞察。",
    applyUrl: "https://example.com/jobs/data-hangzhou",
  },
  {
    id: "4",
    title: "产品经理",
    company: "职达网络",
    city: "深圳",
    salaryMin: 20000,
    salaryMax: 32000,
    educationRequirement: "本科",
    experienceRequirement: 4,
    description: "负责招聘匹配产品规划、需求拆解、用户调研和跨团队项目推进。",
    applyUrl: "https://example.com/jobs/pm-shenzhen",
  },
  {
    id: "5",
    title: "UI 设计师",
    company: "灵感设计",
    city: "广州",
    salaryMin: 12000,
    salaryMax: 20000,
    educationRequirement: "大专",
    experienceRequirement: 2,
    description: "负责 Web 产品界面设计、设计系统维护和交互体验打磨。",
    applyUrl: "https://example.com/jobs/ui-guangzhou",
  },
  {
    id: "6",
    title: "算法工程师",
    company: "深算智能",
    city: "上海",
    salaryMin: 30000,
    salaryMax: 50000,
    educationRequirement: "硕士",
    experienceRequirement: 3,
    description: "负责推荐、搜索和智能匹配算法研发，优化职位推荐准确率。",
    applyUrl: "https://example.com/jobs/algorithm-shanghai",
  },
  {
    id: "7",
    title: "运营专员",
    company: "启航人力",
    city: "成都",
    salaryMin: 8000,
    salaryMax: 13000,
    educationRequirement: "大专",
    experienceRequirement: 1,
    description: "负责职位内容运营、用户增长活动执行和招聘数据反馈跟进。",
    applyUrl: "https://example.com/jobs/operation-chengdu",
  },
  {
    id: "8",
    title: "测试工程师",
    company: "稳测科技",
    city: "南京",
    salaryMin: 14000,
    salaryMax: 22000,
    educationRequirement: "本科",
    experienceRequirement: 2,
    description: "负责 Web 和移动端功能测试、自动化测试脚本编写和质量保障。",
    applyUrl: "https://example.com/jobs/qa-nanjing",
  },
];
