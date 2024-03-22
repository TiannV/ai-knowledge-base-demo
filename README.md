## ChatGPT构建修仙百科

ChatGPT非常适合进行日常的通用问答，但在需要领域特定知识时存在一些不足。此外，它会编造答案来填补其知识空白，并且从不引用其信息来源，因此无法真正被信任。这个起始应用程序使用嵌入向量和向量搜索来解决这个问题，更具体地说，展示了如何利用OpenAI的聊天完成API来创建面向领域特定知识的对话界面。

本应用尝试使用网络修仙小说来构建修仙领域的修仙百科。

使用的技术:
- Next.js (React框架)
- [MemFire](https://cloud.memfiredb.com/auth/login?from=1HdvKv&utm_source=github) (国内版Supabase,使用他们的pgvector实现作为向量数据库)
- OpenAI API (用于生成嵌入和聊天完成)
- TailwindCSS (用于样式)

后续工作：
- 使用MemFire 云函数构建本应用中的api接口
- 使用MemFire 静态托管部署本应用

## 功能概述

创建和存储嵌入:

- 上传修仙小说，转换为纯文本并分割成1000个字符的文档
- 使用OpenAI的嵌入API，利用"text-embedding-ada-002"模型为每个文档生成嵌入
- 将嵌入向量存储在Supabase的postgres表中，使用pgvector; 表包含三列: 文档文本、源URL以及从OpenAI API返回的嵌入向量。

响应查询:

- 从用户提示生成单个嵌入向量
- 使用该嵌入向量对向量数据库进行相似性搜索
- 使用相似性搜索的结果构建GPT-3.5/GPT-4的提示
- 然后将GPT的响应流式传输给用户。

## 修仙体验
1. 上传小说
![zhuxian](https://cnnbrba5g6haaugeu530.baseapi.memfiredb.com/storage/v1/object/public/xiuxian/sc1.png)
![fanren](https://cnnbrba5g6haaugeu530.baseapi.memfiredb.com/storage/v1/object/public/xiuxian/sc2.png)

2. 修仙问答
![xx1](https://cnnbrba5g6haaugeu530.baseapi.memfiredb.com/storage/v1/object/public/xiuxian/xiuxian1.png)
![xx2](https://cnnbrba5g6haaugeu530.baseapi.memfiredb.com/storage/v1/object/public/xiuxian/xiuxian2.png)
![xx3](https://cnnbrba5g6haaugeu530.baseapi.memfiredb.com/storage/v1/object/public/xiuxian/xiuxian2.png)


[体验地址](http://ai.itrunner.cn:3000/)
## 入门指南

以下设置指南假定您至少对使用React和Next.js开发Web应用程序有基本的了解。熟悉OpenAI API和Supabase会对使事情正常运行有所帮助，但不是必需的。

### 设置Supabase
1. 登录[MemFire](https://cloud.memfiredb.com/auth/login?from=1HdvKv&utm_source=github) 创建应用
![yy1](https://cnnbrba5g6haaugeu530.baseapi.memfiredb.com/storage/v1/object/public/xiuxian/xiuxian2.png)

2. 启用Vector扩展
 首先，我们将启用Vector扩展。可以在应用的SQL执行器中运行以下命令完成此操作：

```sql
create extension vector;
```
![yy2](https://cnnbrba5g6haaugeu530.baseapi.memfiredb.com/storage/v1/object/public/xiuxian/yy2.png)

3. 接下来，让我们创建一个表来存储我们的文档及其嵌入。

转到SQL编辑器并运行以下查询：

```sql
create table documents (
  id bigserial primary key,
  content text,
  url text,
  embedding vector (1536)
);
```
![yy3](https://cnnbrba5g6haaugeu530.baseapi.memfiredb.com/storage/v1/object/public/xiuxian/yy3.png)

4. 最后，我们将创建一个用于执行相似性搜索的函数。转到SQL编辑器并运行以下查询：

```sql
create or replace function match_documents (
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  url text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.url,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > similarity_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

```
![yy4](https://cnnbrba5g6haaugeu530.baseapi.memfiredb.com/storage/v1/object/public/xiuxian/yy3.png)

### 设置本地环境

- 安装依赖项
```bash
npm install
```

- 在根目录中创建一个名为`.env.local`的文件以存储环境变量：

```bash
cp .env.local.example .env.local
```

- 打开`.env.local`文件，添加您的Supabase项目URL和API密钥。
![yy5](https://cnnbrba5g6haaugeu530.baseapi.memfiredb.com/storage/v1/object/public/xiuxian/yy3.png)
- 将您的OpenAI API密钥添加到`.env.local`文件。您可以在OpenAI Web门户的`API Keys`下找到它。API密钥应存储在`OPENAI_API_KEY`变量中。
- [可选]提供`OPEAI_PROXY`环境变量以启用您自定义的OpenAI API代理。将其设置为 `""` 以直接调用官方API。
- 启动应用程序

```bash
npm run dev
```

- 在浏览器中打开http://localhost:3000查看应用程序。
