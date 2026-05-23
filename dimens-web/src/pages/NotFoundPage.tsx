import { useNavigate } from 'react-router-dom';
import StateView from '@/components/common/StateView';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <StateView
      title="路由不存在"
      description="当前 Hash 路由未注册，请检查 CDN 地址中的 #/ 路径。"
      action={{ label: '回到首页', onClick: () => navigate('/') }}
    />
  );
}
