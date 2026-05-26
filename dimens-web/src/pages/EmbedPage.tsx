import KeyValueGrid from '@/components/common/KeyValueGrid';
import { useRuntimeStore } from '@/store/runtimeStore';

export default function EmbedPage() {
  const context = useRuntimeStore(state => state.context);

  return (
    <div className="space-y-5">
      <section className="app-card">
        <div className="app-eyebrow">Embed</div>
        <h1 className="app-title mt-2">Wujie 嵌入检查</h1>
        <p className="app-muted mt-2">
          用于验证宿主传入的上下文、权限与实例配置。此页不会主动请求维表数据。
        </p>
      </section>
      <KeyValueGrid
        items={[
          { label: 'isWujie', value: context.isWujie },
          { label: 'source', value: context.source },
          { label: 'initialRoute', value: context.initialRoute },
          { label: 'sourceId', value: context.sourceId },
          { label: 'viewState', value: context.viewState },
          { label: 'actionSnapshot', value: context.actionSnapshot },
          { label: 'permissions', value: context.permissions },
          { label: 'instanceConfig', value: context.instanceConfig },
        ]}
      />
    </div>
  );
}
