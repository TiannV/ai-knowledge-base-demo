import { NextPage } from "next";
import { useState } from "react";

const docSize: number = 100000;

const Embeddings: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const cleanString = (inputString:string) => {
    // 使用正则表达式替换特殊字符
    return inputString.replace(/[\n\r\t\s\"]/g, "");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!file) {
      setLoading(false);
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = () => {
      const text = fileReader.result as string;

      const requestData = {
            textContent: text,
            url: fileName
      };

      if(text) {
        let start = 0;
        while (start < text.length) {
          const end = start + docSize;
          const chunk = cleanString(text.slice(start, end));
          const requestData = {
            textContent: chunk,
            url: fileName
          };
          sendRequest(requestData);
          start = end;
       }
     }

    };

    fileReader.readAsText(file);
  };

  const sendRequest = async (data: any) => {
    try {
      const response = await fetch("/api/generate-embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      setLoading(false);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
      // Handle error
    }
  };

  return (
    <div className="flex flex-col items-center max-w-xl m-auto text-center">
      <h1 className="w-full my-5 text-2xl font-bold sm:text-4xl ">
        生成嵌入
      </h1>
      <p className="mb-4">
        上传修仙宝典（小说），使用OpenAI API生成嵌入，并将嵌入添加到Supabase嵌入表中。
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".txt" // 如有需要，指定接受的文件类型
        />
        {fileName && <p>选择的文件：{fileName}</p>}
        <button
          className="my-4 btn btn-primary"
          type="submit"
          disabled={!file || loading}
        >
          生成嵌入
        </button>
      </form>
      {loading && <div>加载中...</div>}
    </div>
  );
};

export default Embeddings;
