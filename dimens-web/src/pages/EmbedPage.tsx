import KeyValueGrid from '@/components/common/KeyValueGrid';
import { useRuntimeStore } from '@/store/runtimeStore';

export default function EmbedPage() {
  const context = useRuntimeStore(state => state.context);

  return (
    <div className="space-y-5">
      <section className="border border-ink-900/10 bg-white p-5 shadow-panel">
        <div className="text-xs uppercase tracking-[0.18em] text-copper-500">Embed</div>
        <h1 className="mt-2 text-2xl font-semibold">Wujie 嵌入检查</h1>
        <p className="mt-2 text-sm leading-6 text-ink-700">
          用于验证宿主传入的上下文、权限与实例配置。此页不会主动请求维表数据。
        </p>
      </section>
      <KeyValueGrid
        items={[
          { label: 'isWujie', value: context.isWujie },
          { label: 'source', value: context.source },
          { label: 'initialRoute', value: context.initialRoute },
          { label: 'sourceId', value: context.sourceId },
          { label: 'permissions', value: context.permissions },
          { label: 'instanceConfig', value: context.instanceConfig },
        ]}
      />
    </div>
  );
}
