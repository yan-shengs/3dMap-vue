// 定义加载json数据的函数

export const jsonLoader = async (jsonURL) => {
  try {
    const response = await fetch(jsonURL)

    if (!response.ok) {
      throw new Error(`Http错误, ${response.status}`)
    }

    const data = await response.json()

    return data
  } catch (error) {
    console.error('请检查网络或json路径', error)
    return error
  }
}
