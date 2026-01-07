import { ImageSize } from './types';

export const AMAZON_SIZES: ImageSize[] = [
  // 功能 1：主图
  { label: '主图 (标准)', width: 1800, height: 1800, category: 'Main' },
  { label: '主图 (高清)', width: 2000, height: 2000, category: 'Main' },
  
  // 功能 2：附图
  { label: '附图 (方形)', width: 2000, height: 2000, category: 'Secondary' },
  { label: '附图 (纵向)', width: 2000, height: 3000, category: 'Secondary' },

  // 功能 3：A+ 图
  { label: 'A+ 标准页眉', width: 970, height: 600, category: 'A+' },
  { label: 'A+ 方块图', width: 300, height: 300, category: 'A+' },
  { label: 'A+ 纵向图', width: 300, height: 400, category: 'A+' },
  { label: 'A+ 列表小图', width: 350, height: 175, category: 'A+' },
  { label: 'A+ 比较图', width: 135, height: 135, category: 'A+' },
  { label: 'A+ 图标', width: 220, height: 220, category: 'A+' },
  { label: 'A+ 横幅', width: 970, height: 300, category: 'A+' },
  { label: 'A+ 侧边', width: 150, height: 300, category: 'A+' },

  // 功能 4：高级 A+ 图
  { label: '高级 A+ 大图', width: 800, height: 600, category: 'Premium A+' },
  { label: '高级 A+ 中图', width: 650, height: 350, category: 'Premium A+' },
  { label: '高级 A+ 全宽', width: 1464, height: 600, category: 'Premium A+' },
  { label: '高级 A+ 4:3', width: 600, height: 450, category: 'Premium A+' },
  { label: '高级 A+ 小图', width: 300, height: 225, category: 'Premium A+' },
  { label: '高级 A+ 极小', width: 200, height: 225, category: 'Premium A+' },
  { label: '高级 A+ 竖版', width: 488, height: 700, category: 'Premium A+' },

  // 功能 5：品牌故事
  { label: '品牌故事 背景', width: 1464, height: 625, category: 'Brand Story' },
  { label: '品牌故事 卡片', width: 463, height: 625, category: 'Brand Story' },
  { label: '品牌故事 LOGO', width: 166, height: 182, category: 'Brand Story' },
  { label: '品牌故事 媒体', width: 362, height: 453, category: 'Brand Story' },

  // 功能 6：Shoppable
  { label: 'Shoppable 小图', width: 110, height: 110, category: 'Shoppable' },
  { label: 'Shoppable 展示', width: 285, height: 435, category: 'Shoppable' },
];

export const INITIAL_SYSTEM_PROMPT = `
你是一个专业的亚马逊电商视觉设计师。你的任务是帮助用户优化产品图片，以提高点击率和转化率。
请使用中文回答所有问题。
当用户请求修改图片时，请仔细分析图片内容，并给出专业的建议或执行相应的图像生成操作。
`;
