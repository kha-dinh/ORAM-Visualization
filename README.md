# ORAM Visualization
Path ORAM algorithm visualization using [Algorithm Visualizer](https://github.com/algorithm-visualizer/algorithm-visualizer).
# TODO
- [ ] Implement buckets. Currently, bucket size is 1, which may be why the stash usage is very high. This can be implemented as a new view called "Current bucket", that shows the bucket that the algorithm is processing.
# How to use
## Local
When running locally, the algorithm is executed on your machine, and only the trace steps are sent to [Algorithm Visualizer](https://github.com/algorithm-visualizer/algorithm-visualizer). However, you cannot simulate too many ORAM access, since there are limitations for trace steps you can send.
Installing dependencies:
```bash
npm install
```
Runing:
```bash
node oram-access.js
```


## Online
You can copy the content of `oram-access.js` into the code editor of [Algorithm Visualizer](https://github.com/algorithm-visualizer/algorithm-visualizer) and play with the code there. With this, you can simulate much more steps.
