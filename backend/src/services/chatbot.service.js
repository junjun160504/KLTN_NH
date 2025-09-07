export async function reply(message) {
    let suggestion = "Mình chưa hiểu rõ lắm. Bạn có thể nói rõ hơn?";

    if (message.includes("2 người") && message.includes("200k")) {
        suggestion = "Gợi ý combo: Cơm tấm + Gỏi cuốn + Cà phê = 190k cho 2 người";
    } else if (message.includes("ít cay")) {
        suggestion = "Bạn có thể thử Bún bò không cay hoặc Cơm sườn nhẹ vị cay nhé!";
    }

    return {
        message,
        suggestion
    };
}
