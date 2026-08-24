---
title: BIO、NIO、AIO 的区别与应用场景
published: 2025-09-30
description: 从阻塞、非阻塞和异步模型出发，对比 BIO、NIO、AIO 的工作方式、零拷贝和典型应用场景。
image: ''
tags: [Java, BIO, NIO, AIO]
category: Tech
draft: false
lang: zh_CN
---

在琢磨代码性能这件事儿时，I/O 往往是那个"定生死"的环节。只有在对的场景，用对的方法去驾驭 I/O，才能真正把程序的效率拉满。这篇文章是我这段时间对主流三种 I/O 方式深入钻研后的心得复盘，算是把这段时间的死磕和折腾记录下来，免得以后脑子短路了还得重新翻源码。

# BIO

当用户线程调用 `read()` 方法时，如果没有数据可读，线程会一直阻塞，直到内核准备好数据并将其复制到用户空间缓冲区，`read()` 方法才返回，线程才能继续执行后续逻辑。

以下是传统BIO的方式处理访问的代码：

    {
     ExecutorService executor = Excutors.newFixedThreadPollExecutor(100);//线程池
    
     ServerSocket serverSocket = new ServerSocket();
     serverSocket.bind(8088);
     while(!Thread.currentThread.isInturrupted()){//主线程死循环等待新连接到来
     Socket socket = serverSocket.accept();
     executor.submit(new ConnectIOnHandler(socket));//为新的连接创建新的线程
    }
    
    class ConnectIOnHandler extends Thread{
        private Socket socket;
        public ConnectIOnHandler(Socket socket){
           this.socket = socket;
        }
        public void run(){
          while(!Thread.currentThread.isInturrupted()&&!socket.isClosed()){死循环处理读写事件
              String someThing = socket.read()....//读取数据
              if(someThing!=null){
                 ......//处理数据
                 socket.write()....//写数据
              }
    
          }
        }
    }

该模型的关键短板在于严重依赖内核线程（thread）。线程虽然比完整进程轻量，但仍是内核可调度的实体，因此带来若干问题：

1.  创建/销毁线程涉及内核态开销，频繁创建会影响性能（常用的解决是使用线程池复用线程）。

2.  每个线程占用线程栈等资源（在 JVM 中默认栈大小通常在几百 KB 至 1MB 量级），大量线程会消耗大量虚拟地址空间与物理内存，需通过调小栈或改用轻量并发模型缓解。

3.  线程上下文切换需要内核参与，频繁切换会增加系统调用/内核时间，并在高并发短任务场景中显著影响整体吞吐。

4.  在阻塞/同步的设计下，大量线程同时被唤醒或返回可能造成瞬时的运行队列激增（thundering herd），导致 load 和内核态 CPU 使用急升，使系统响应变差。

因此在高并发场景下，常推荐使用线程池、非阻塞 I/O（epoll/kqueue/io_uring）、事件驱动或用户态协程/轻量绿线程来减少内核线程数并提高资源利用率。

# NIO

## 零拷贝

NIO 支持零拷贝接口，为了理解其优势，首先需要说明零拷贝解决了哪些性能瓶颈，以及它在数据传输中具体是如何工作的。

**传统 BIO（上传数据）常见步骤：**

1.  应用调用 `read()`，请求从文件读取数据。

2.  线程进入内核态，内核将磁盘数据读入 **页缓存（page cache）**（内核空间），并将数据从内核空间复制到用户空间的缓冲区；系统调用返回，线程返回用户态。

3.  应用从用户缓冲区读取数据并准备发送，随后调用 `write()`（或 `send`/`sendto`）将数据提交给内核的 socket。

4.  线程再次进入内核态，内核将数据从用户缓冲区复制到 socket 的内核缓冲区，网络栈把数据发往网卡，系统调用返回，线程回到用户态。

在上述流程中，**两次内核↔用户空间的拷贝** 和 **多次用户态/内核态切换** 会消耗大量 CPU 和内存带宽，特别是在大文件和高并发传输时。

**零拷贝 优化（上传数据）常见步骤：**

1.  应用发起"文件直接发送到网络"的请求（例如在 Linux 上使用 `sendfile()`，在 Java 中使用 `FileChannel.transferTo`）。

2.  线程进入内核态，内核在内核空间（页缓存）中直接将文件页的数据交给网络栈------即把页缓存的数据引用或内容放入 socket 的内核缓冲结构，**避免把数据先复制到用户空间**；操作完成后线程返回用户态（通常只需一次系统调用）。

3.  内核由网络栈/NIC 发起 DMA 传输，将数据从内核缓冲区/页缓存发送到网卡并出网。

这样做的好处是：省掉了一次用户空间的内存拷贝（内核→用户→内核 的那次往返）并通常减少系统调用或上下文切换，从而降低 CPU 占用并提高大数据量传输的效率------这就是所谓的 **零拷贝** 概念。

**可以把零拷贝理解为：内核在内核空间直接引用文件的页缓存并把这些页面对应的物理地址或描述符交给网卡，网卡通过 DMA 从内存读取并发送数据，从而避免了将数据先复制到用户空间再复制回内核的中间拷贝。**

可以结合以下的代码去理解零拷贝：

``` java
public static void transferFileContents(SocketChannel socket, Path file) throws IOException {
    try (FileChannel fc = FileChannel.open(file, StandardOpenOption.READ)) {
        long size = fc.size();
        long pos = 0L;
        while (pos < size) {
            // FileChannel.transferTo 的返回值表示实际传输了多少字节。
            // 理想情况下，如果能成功走零拷贝，它会返回一个正数 n > 0，表示已经发送了 n 字节。
            long n = fc.transferTo(pos, size - pos, socket);
            if (n > 0) {
                pos += n;
            } else {
                // transferTo 返回 0，可能是由于socket缓冲区满了，可以等待再重试
                try { Thread.sleep(1); } catch (InterruptedException ignored) {}
            }
        }
    }
}
```

## 非阻塞理念

NIO 全称为 **Non-blocking I/O**（非阻塞输入/输出）。其非阻塞特性体现在：当通道（Channel）处于非阻塞模式时，调用 `read()` 或 `write()` 不会让线程阻塞，如果数据尚未准备好，方法会立即返回（Java中会返回0），而不是等待数据就绪。所以 NIO 需要通过 **轮询** 来保证数据被传输完成。

在 **本地磁盘读写** 场景下，NIO 与传统 BIO 在吞吐和延迟上通常没有显著差距（瓶颈更多来自磁盘带宽、缓存命中等）。NIO 的优势在网络传输场景更明显。

在网络场景下，如果使用 BIO（阻塞 I/O），每个 Socket 连接都必须由一个线程阻塞等待数据到达，这在高并发情况下会消耗大量线程资源，造成资源浪费。NIO（非阻塞 I/O）通过 Selector 等多路复用机制，让少量线程即可管理大量 Socket 连接，实现非阻塞的高效资源利用。

![](imgs/NIO.png)

以下是通过Java代码来展示一种通过NIO进行网络读写的方式：

    public class NioServerDemo {
        public static void main(String[] args) throws IOException {
            int port = 9000;
    
            // 1. 创建非阻塞 ServerSocketChannel
            ServerSocketChannel serverChannel = ServerSocketChannel.open();
            serverChannel.bind(new InetSocketAddress(port));
            serverChannel.configureBlocking(false);
    
            // 2. 创建 Selector 并注册 ACCEPT 事件
            Selector selector = Selector.open();
            serverChannel.register(selector, SelectionKey.OP_ACCEPT);
    
            System.out.println("NIO Server listening on port " + port);
    
            ByteBuffer buffer = ByteBuffer.allocate(1024);
    
            while (true) {
                selector.select(); // 阻塞直到有事件
                Set<SelectionKey> keys = selector.selectedKeys();
                Iterator<SelectionKey> iter = keys.iterator();
    
                while (iter.hasNext()) {
                    SelectionKey key = iter.next();
                    iter.remove();
    
                    if (key.isAcceptable()) {
                        // 接受新连接
                        SocketChannel client = serverChannel.accept();
                        client.configureBlocking(false);
                        client.register(selector, SelectionKey.OP_READ);
                        System.out.println("Accepted connection from " + client.getRemoteAddress());
                    }
    
                    else if (key.isReadable()) {
                        // 客户端可读
                        SocketChannel client = (SocketChannel) key.channel();
                        buffer.clear();
                        int bytesRead = client.read(buffer);
    
                        if (bytesRead == -1) {
                            key.cancel();
                            client.close();
                            System.out.println("Client disconnected");
                            continue;
                        }
    
                        buffer.flip();
                        client.write(buffer); // 回写数据
                    }
                }
            }
        }
    }

# AIO

为了解决 NIO 中可能存在的轮询问题（线程需要不断检查通道是否就绪），AIO（Asynchronous I/O，异步输入/输出）被设计出来。与 NIO 的非阻塞 I/O 不同，AIO 是一种 **真正的异步 I/O 模型**：应用线程在发起读/写操作后立即返回，无需阻塞或轮询，内核在后台完成 I/O 操作，并在操作完成时通过 **回调或异步通知机制** 告知应用程序。

AIO 相当于为每个 Socket 聘请了一个 **硬件级代理**。在 BIO 中，你需要亲自动用 CPU 线程去死等并搬运数据；而在 AIO 中，你只需交给操作系统一个地址（Buffer）。随后，操作系统会 **调动 DMA 硬件，让数据绕过 CPU 直接从网卡搬运到你的内存中**。整个'盯着网卡'和'搬运数据'的过程不占用任何线程资源，直到 DMA 完成最后一块数据的拷贝，操作系统才会触发回调函数通知你。这就像是把'体力活'外包给了底层硬件，实现了真正的零阻塞。

因此，AIO 并不是 NIO 的"新版本"，而是为高并发场景下提高线程利用率和系统性能而设计的另一种 I/O 模型，它可以与 NIO、BIO 配合使用，但在设计理念上是独立的。

可以参考如下Java代码去理解：

``` auto
private static void writeFile(AsynchronousSocketChannel client, AsynchronousFileChannel fileChannel,
                              ByteBuffer buffer, long position) {
    fileChannel.read(buffer, position, null, new CompletionHandler<Integer, Void>() {
        @Override
        public void completed(Integer bytesRead, Void attachment) {
            if (bytesRead == -1) {
                // 文件发送完成
                try { client.close(); fileChannel.close(); } catch (IOException ignored) {}
                System.out.println("File sent successfully!");
                return;
            }
            buffer.flip();
            client.write(buffer, null, new CompletionHandler<Integer, Void>() {
                @Override
                public void completed(Integer bytesWritten, Void attachment) {
                    buffer.clear();
                    writeFile(client, fileChannel, buffer, position + bytesRead); // 继续读取并写入
                }

                @Override
                public void failed(Throwable exc, Void attachment) {
                    exc.printStackTrace();
                }
            });
        }

        @Override
        public void failed(Throwable exc, Void attachment) {
            exc.printStackTrace();
        }
    });
}
```

# 总结

| 特性 / 类型 | BIO（Blocking I/O） | NIO（Non-blocking I/O） | AIO（Asynchronous I/O） |
|----|----|----|----|
| **中文名称** | 阻塞 I/O | 非阻塞 I/O | 异步 I/O |
| **I/O 模型** | 同步阻塞 | 同步非阻塞 | 异步通知 |
| **线程行为** | 读写操作会阻塞线程，线程等待数据完成 | 线程可以非阻塞轮询，检查通道是否就绪 | 线程发起操作后立即返回，内核完成后通知线程 |
| **操作方式** | 阻塞等待数据到来 | 不阻塞，可轮询就绪状态 | 不阻塞，内核异步回调完成 |
| **典型应用** | 小规模客户端、简单网络通信 | 高并发服务器（避免每个请求一个线程） | 高并发、大量连接、性能敏感场景 |
| **解决问题** | 简单易用，但线程资源消耗大 | 解决 BIO 的线程阻塞问题，提高并发处理能力 | 进一步减少 CPU 轮询，提高响应效率和吞吐量 |
| **缺点** | 线程占用资源高，扩展性差 | 编程复杂，需要管理 Selector 和缓冲区 | 编程更复杂，需要回调处理，调试不易 |
| **数据流处理** | 阻塞式读取 | 可以非阻塞读取 | 由内核异步完成数据传输（有回调） |
| **适合场景** | 小型应用、客户端、低并发 | 高并发服务器、需要减少线程数 | 高并发服务器、文件传输、网络传输、大量连接场景 |
