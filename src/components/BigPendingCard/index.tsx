import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import usePendingGameStore from '@/store/pendingGamesStore';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { nanoid } from 'nanoid'
import { GameMeta } from '@/types/game';

interface Props {
  data: any; // 搜索结果原始数据
}

const BigPendingCard: React.FC<Props> = ({ data }) => {
  const { updateReadyGame } = usePendingGameStore();
  const [activeSource, setActiveSource] = useState<'vndb' | 'bangumi' | 'ymgal'>('vndb');

  // 1. 提取不同源的数据快照
  const metaDisplay = useMemo(() => {
    const sources = {
      vndb: () => {
        const res = data.vndb?.results?.[0];
        return res ? {
          name: res.title,
          cover: res.image?.url,
          bg: res.screenshots?.[0]?.url || res.image?.url,
          desc: res.description,
          tags: res.tags?.slice(0, 8).map((t: any) => t.name) || []
        } : null;
      },
      bangumi: () => {
        const res = data.bangumi?.data?.[0];
        return res ? {
          name: res.name_cn || res.name,
          cover: res.image,
          bg: res.images?.large || res.image,
          desc: res.summary,
          tags: []
        } : null;
      },
      ymgal: () => {
        const res = data.ymgal?.data?.result?.[0];
        return res ? {
          name: res.name,
          cover: res.mainImg,
          bg: res.mainImg,
          desc: "暂无简介",
          tags: []
        } : null;
      }
    };
    return sources[activeSource]();
  }, [activeSource, data]);

  // 此钩子函数用与保存最终选了的那些要持久化存储数据的游戏的资源
  useEffect(() => {
    if (activeSource === 'vndb' && data.vndb?.results[0]) {
      const gameMeta: GameMeta = {
        id: nanoid(),
        name: data.vndb.results[0].title,
        length: data.vndb.results[0].length,
        absPath: data.absPath || "",
        cover: data.vndb.results[0].image.url,
        background: data.vndb.results[0].screenshots[0].url,
        playTime: 0,
        size: undefined,
        lastPlayedAt: null
      }
      updateReadyGame(gameMeta)
    }
    if (activeSource === 'bangumi' && data.bangumi?.data[0]) {
      const gameMeta: GameMeta = {
        id: nanoid(),
        name: data.bangumi.data[0].name,
        length: 0,
        absPath: data.absPath || "",
        cover: data.bangumi.data[0].image,
        background: data.bangumi.data[0].images.large,
        playTime: 0,
        size: undefined,
        lastPlayedAt: null
      }
      updateReadyGame(gameMeta)
    }
    if (activeSource === 'ymgal' && data.ymgal?.data.result[0]) {
      const gameMeta: GameMeta = {
        id: nanoid(),
        name: data.ymgal.data.result[0].name,
        length: 0,
        absPath: data.absPath || "",
        cover: data.ymgal.data.result[0].mainImg,
        background: data.ymgal.data.result[0].mainImg,
        playTime: 0,
        size: undefined,
        lastPlayedAt: null
      }
      updateReadyGame(gameMeta)
    }
  }, [activeSource])

  return (
    <div className='w-full h-full overflow-hidden'>
      <Card className="w-full h-full max-w-8xl mx-auto border-2 aspect-auto">
        <div className="w-full h-full flex">
          {/* 左侧：封面大图 */}
          <div className="w-full h-full md:w-1/3 bg-muted flex flex-col justify-center p-0">
            <img
              src={metaDisplay?.cover}
              alt="Cover"
              className="w-full h-full object-cover aspect-[3/4] shadow-lg"
            />
          </div>

          {/* 右侧：详细内容 */}
          <div className="flex-1 flex flex-col gap-1.5 overflow-y-scroll">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold">{metaDisplay?.name || "未发现数据"}</CardTitle>
                  <CardDescription className="mt-2 font-mono text-xs break-all">
                    {data.absPath}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="ml-2 uppercase text-primary border-primary">
                  {activeSource}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              <Separator />

              {/* 标签展示 (如果有) */}
              {metaDisplay?.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {metaDisplay?.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 简介滚动区域 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">简介</h4>
                <ScrollArea className="w-full rounded-md border p-3 bg-muted/30 flex-1">
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    {metaDisplay?.desc || "暂无简介内容..."}
                  </p>
                </ScrollArea>
              </div>

              {/* 数据源选择器 */}
              <div className="pt-4">
                <p className="text-sm font-medium mb-3">数据不满意？尝试切换源：</p>
                <div className="flex gap-2">
                  {(['vndb', 'bangumi', 'ymgal'] as const).map((src) => (
                    <Button
                      key={src}
                      variant={activeSource === src ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveSource(src)}
                      className="flex-1 capitalize"
                    >
                      {src}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BigPendingCard;
